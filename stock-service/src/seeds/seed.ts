
import { AppDataSource } from 'src/db/data-source';
import { StockItem } from '../stock/stock.entity';

async function seed() {
  await AppDataSource.initialize();
  console.log('📦 Database connected');

  const stockRepo = AppDataSource.getRepository(StockItem);

  const count = await stockRepo.count();
  if (count > 0) {
    console.log('⚠️  Stock table already has data, skipping seed');
    await AppDataSource.destroy();
    return;
  }

  await stockRepo.save([
    { productId: 1, quantity: 10 },
    { productId: 2, quantity: 25 },
    { productId: 3, quantity: 50 },
    { productId: 4, quantity: 8 },
  ]);

  console.log('🌱 Seeded stock for 4 products');
  await AppDataSource.destroy();
  console.log('✅ Done');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});