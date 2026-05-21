import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('stock_items')
export class StockItem {
  @PrimaryColumn()
  productId: number;

  @Column({ type: 'int', default: 0 })
  quantity: number;

  @UpdateDateColumn()
  updatedAt: Date;
}