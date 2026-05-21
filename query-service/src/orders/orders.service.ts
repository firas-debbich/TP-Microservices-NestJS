import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { OrderType } from './order.type';

@Injectable()
export class OrdersService {
  private readonly orderUrl: string;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.orderUrl = this.config.getOrThrow<string>('ORDER_SERVICE_URL');
  }

  async findAll(): Promise<OrderType[]> {
    try {
      const { data } = await firstValueFrom(
        this.http.get<OrderType[]>(`${this.orderUrl}/orders`),
      );
      return data;
    } catch (err) {
      console.error('❌ Failed to reach order-service:', err.message);
      return [];
    }
  }

  async findOne(id: number): Promise<OrderType | null> {
    try {
      const { data } = await firstValueFrom(
        this.http.get<OrderType>(`${this.orderUrl}/orders/${id}`),
      );
      return data;
    } catch {
      return null;
    }
  }
}