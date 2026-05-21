import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { KafkaProducerService } from './kafka-producer.service';
import { Order } from './order.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order]),
    // Register the gRPC client for stock-service
    ClientsModule.registerAsync([
      {
        name: 'STOCK_SERVICE',
        imports: [ConfigModule],
        useFactory: (config: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: 'stock',
            protoPath: join(__dirname, '../../proto/stock.proto'),
            url: config.get<string>('STOCK_SERVICE_URL'),
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService, KafkaProducerService],
})
export class OrdersModule {}