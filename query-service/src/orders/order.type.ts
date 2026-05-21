import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

@ObjectType()
export class OrderType {
  @Field(() => ID)
  id: number;

  @Field(() => ID)
  productId: number;

  @Field(() => Int)
  quantity: number;

  @Field()
  customerEmail: string;

  @Field()
  status: string;

  @Field({ nullable: true })
  createdAt?: string;
}