import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer } from 'kafkajs';

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private readonly kafka: Kafka;
  private readonly producer: Producer;

  constructor(private readonly config: ConfigService) {
    this.kafka = new Kafka({
      clientId: 'order-service',
      brokers:config.getOrThrow<string>('KAFKA_BROKERS').split(','),
    });
    this.producer = this.kafka.producer();
  }

  // Connects to Kafka when the module starts
  async onModuleInit() {
    await this.producer.connect();
    console.log('📨 Kafka producer connected');
  }

  // Disconnects cleanly when the app shuts down
  async onModuleDestroy() {
    await this.producer.disconnect();
  }

  async publishOrderCreated(order: {
    id: number;
    productId: number;
    quantity: number;
    customerEmail: string;
    status: string;
    createdAt: Date;
  }) {
    const message = {
      orderId: order.id,
      productId: order.productId,
      quantity: order.quantity,
      customerEmail: order.customerEmail,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
      publishedAt: new Date().toISOString(),
    };

    await this.producer.send({
      topic: 'order.created',
      messages: [
        {
          key: String(order.id),
          value: JSON.stringify(message),
        },
      ],
    });

    console.log(`📤 [Kafka] Published order.created for order #${order.id} → ${order.customerEmail}`);
  }
}