import {
  Injectable,
  Inject,
  OnModuleInit,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { ClientGrpc } from '@nestjs/microservices';
import { Observable, firstValueFrom } from 'rxjs';
import { Order, OrderStatus } from './order.entity';
import { CreateOrderDto } from './order.dto';
import { KafkaProducerService } from './kafka-producer.service';

// Matches the StockService definition in stock.proto
interface StockGrpcService {
  checkAndReserve(data: {
    productId: number;
    quantity: number;
  }): Observable<{ available: boolean; message: string; remainingStock: number }>;
}

@Injectable()
export class OrdersService implements OnModuleInit {
  private stockGrpcService: StockGrpcService;

  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @Inject('STOCK_SERVICE')
    private readonly stockClient: ClientGrpc,
    private readonly kafkaProducer: KafkaProducerService,
  ) {}

  // Must be called here not in constructor — gRPC client needs to be fully initialized first
  onModuleInit() {
    this.stockGrpcService = this.stockClient.getService<StockGrpcService>('StockService');
    console.log('🔗 gRPC StockService client initialized');
  }

  async create(dto: CreateOrderDto): Promise<Order> {
    console.log(`\n📋 Creating order — productId=${dto.productId}, qty=${dto.quantity}, email=${dto.customerEmail}`);

    // Step 1 — Call stock-service via gRPC
    let stockResponse: { available: boolean; message: string; remainingStock: number };
    try {
      stockResponse = await firstValueFrom(
        this.stockGrpcService.checkAndReserve({
          productId: dto.productId,
          quantity: dto.quantity,
        }),
      );
    } catch (err) {
      throw new BadRequestException(`Stock service error: ${err.message}`);
    }

    // Step 2 — Stock insufficient → return 409
    if (!stockResponse.available) {
      throw new ConflictException({
        message: stockResponse.message,
        remainingStock: stockResponse.remainingStock,
      });
    }

    // Step 3 — Save the order
    const order = this.orderRepo.create({
      ...dto,
      status: OrderStatus.CONFIRMED,
    });
    const saved = await this.orderRepo.save(order);
    console.log(`✅ Order #${saved.id} saved with status CONFIRMED`);

    // Step 4 — Publish Kafka event
    await this.kafkaProducer.publishOrderCreated(saved);

    return saved;
  }

  async findAll(): Promise<Order[]> {
    return this.orderRepo.find({ order: { id: 'ASC' } });
  }

  async findOne(id: number): Promise<Order> {
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) throw new NotFoundException(`Order #${id} not found`);
    return order;
  }
}