import { DataSource } from 'typeorm';

import * as dotenv from 'dotenv';
import { Order } from '../orders/order.entity';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [Order],
  migrations: ['dist/migrations/*.js'],
  migrationsTableName: 'typeorm_migrations',
  synchronize: false,
  logging: true,
});