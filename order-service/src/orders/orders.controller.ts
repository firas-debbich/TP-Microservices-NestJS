import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './order.dto';
import { Order } from './order.entity';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new order',
    description: 'Validates stock via gRPC → saves order → publishes Kafka event',
  })
  @ApiResponse({ status: 201, type: Order })
  @ApiResponse({ status: 400, description: 'Validation error or stock service unavailable' })
  @ApiResponse({ status: 409, description: 'Insufficient stock' })
  create(@Body() dto: CreateOrderDto): Promise<Order> {
    return this.ordersService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all orders' })
  @ApiResponse({ status: 200, type: [Order] })
  findAll(): Promise<Order[]> {
    return this.ordersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an order by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, type: Order })
  @ApiResponse({ status: 404, description: 'Order not found' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Order> {
    return this.ordersService.findOne(id);
  }
}