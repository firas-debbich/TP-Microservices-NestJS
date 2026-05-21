import { DataSource } from 'typeorm';

import * as dotenv from 'dotenv';
import { Product } from '../products/product.entity';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [Product],
  migrations: ['dist/migrations/*.js'],
  migrationsTableName: 'typeorm_migrations',
  synchronize: false,
  logging: true,
});