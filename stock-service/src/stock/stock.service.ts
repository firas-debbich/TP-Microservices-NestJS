import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockItem } from './stock.entity';

interface StockRequest {
  productId: number;
  quantity: number;
}

interface StockResponse {
  available: boolean;
  message: string;
  remainingStock: number;
}

@Injectable()
export class StockService {
  constructor(
    @InjectRepository(StockItem)
    private readonly stockRepo: Repository<StockItem>,
  ) {}

  async checkAndReserve(data: StockRequest): Promise<StockResponse> {
    console.log(`📦 [gRPC] CheckAndReserve — productId=${data.productId}, qty=${data.quantity}`);

    const item = await this.stockRepo.findOne({
      where: { productId: data.productId },
    });

    if (!item) {
      return {
        available: false,
        message: `Product #${data.productId} not found in stock`,
        remainingStock: 0,
      };
    }

    if (item.quantity < data.quantity) {
      return {
        available: false,
        message: `Insufficient stock. Requested: ${data.quantity}, Available: ${item.quantity}`,
        remainingStock: item.quantity,
      };
    }

    item.quantity -= data.quantity;
    await this.stockRepo.save(item);

    console.log(`✅ Reserved ${data.quantity} units of product #${data.productId}. Remaining: ${item.quantity}`);

    return {
      available: true,
      message: `Stock reserved successfully`,
      remainingStock: item.quantity,
    };
  }
}