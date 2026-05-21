import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockModule } from './stock/stock.module';
import { AppDataSource } from './db/data-source';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: () => AppDataSource.options,
    }),
    StockModule,
  ],
})
export class AppModule {}