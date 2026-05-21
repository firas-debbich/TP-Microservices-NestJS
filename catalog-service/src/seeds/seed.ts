
import { AppDataSource } from 'src/db/data-source';
import { Product } from '../products/product.entity';

async function seed() {

  await AppDataSource.initialize();
  console.log('📦 Database connected');

  const productRepo = AppDataSource.getRepository(Product);


  const count = await productRepo.count();
  if (count > 0) {
    console.log('⚠️  Products table already has data, skipping seed');
    await AppDataSource.destroy();
    return;
  }


  await productRepo.save([
    { name: 'Laptop Pro', price: 1200, stock: 10 },
    { name: 'Mechanical Keyboard', price: 150, stock: 25 },
    { name: 'USB-C Hub', price: 45, stock: 50 },
    { name: 'Monitor 4K', price: 750, stock: 8 },
  ]);

  console.log('🌱 Seeded 4 products successfully');

  await AppDataSource.destroy();
  console.log('✅ Done');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});