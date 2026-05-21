import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockController } from './stock.controller';
import { StockService } from './stock.service';
import { StockItem } from './stock.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StockItem])],
  controllers: [StockController],
  providers: [StockService],
})
export class StockModule {}