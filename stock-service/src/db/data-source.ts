import { DataSource } from 'typeorm';

import * as dotenv from 'dotenv';
import { StockItem } from '../stock/stock.entity';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [StockItem],
  migrations: ['dist/migrations/*.js'],
  migrationsTableName: 'typeorm_migrations',
  synchronize: false,
  logging: true,
});