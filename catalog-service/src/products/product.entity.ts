import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  @ApiProperty({ example: 1 })
  id: number;

  @Column({ length: 255 })
  @ApiProperty({ example: 'Laptop' })
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  @ApiProperty({ example: 1200.00 })
  price: number;

  @Column({ type: 'int', default: 0 })
  @ApiProperty({ example: 10 })
  stock: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}