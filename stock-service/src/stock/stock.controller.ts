import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { StockService } from './stock.service';

interface StockRequest {
  productId: number;
  quantity: number;
}

interface StockResponse {
  available: boolean;
  message: string;
  remainingStock: number;
}

@Controller()
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @GrpcMethod('StockService', 'CheckAndReserve')
  checkAndReserve(data: StockRequest): Promise<StockResponse> {
    return this.stockService.checkAndReserve(data);
  }
}