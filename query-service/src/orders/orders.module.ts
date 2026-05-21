import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { OrdersResolver } from './orders.resolver';
import { OrdersService } from './orders.service';

@Module({
  imports: [HttpModule],
  providers: [OrdersResolver, OrdersService],
})
export class OrdersModule {}