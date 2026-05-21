import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  FAILED = 'FAILED',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  @ApiProperty({ example: 1 })
  id: number;

  @Column()
  @ApiProperty({ example: 1 })
  productId: number;

  @Column()
  @ApiProperty({ example: 2 })
  quantity: number;

  @Column()
  @ApiProperty({ example: 'client@test.com' })
  customerEmail: string;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  @ApiProperty({ enum: OrderStatus, example: OrderStatus.CONFIRMED })
  status: OrderStatus;

  @CreateDateColumn()
  createdAt: Date;
}