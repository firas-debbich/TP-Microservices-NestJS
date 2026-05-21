import { Resolver, Query, Args, ID, Mutation, InputType, Field, Int } from '@nestjs/graphql';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { OrdersService } from './orders.service';
import { OrderType } from './order.type';
import { IsEmail, IsInt, IsPositive } from 'class-validator';

@InputType()
export class CreateOrderInput {
  @Field(() => ID)
  @IsInt()
  productId: number;

  @Field(() => Int)
  @IsInt()
  @IsPositive()
  quantity: number;

  @Field()
  @IsEmail()
  customerEmail: string;
}

@Resolver(() => OrderType)
export class OrdersResolver {
  private readonly orderUrl: string;

  constructor(
    private readonly ordersService: OrdersService,
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.orderUrl = this.config.getOrThrow<string>('ORDER_SERVICE_URL');
  }

  @Query(() => [OrderType], { name: 'orders' })
  findAll(): Promise<OrderType[]> {
    return this.ordersService.findAll();
  }

  @Query(() => OrderType, { name: 'orderById', nullable: true })
  findOne(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<OrderType | null> {
    return this.ordersService.findOne(Number(id));
  }


  @Mutation(() => OrderType)
  async createOrder(
    @Args('input') input: CreateOrderInput,
  ): Promise<OrderType> {
    const { data } = await firstValueFrom(
      this.http.post<OrderType>(`${this.orderUrl}/orders`, {
        productId: Number(input.productId),
        quantity: input.quantity,
        customerEmail: input.customerEmail,
      }),
    );
    return data;
  }
}