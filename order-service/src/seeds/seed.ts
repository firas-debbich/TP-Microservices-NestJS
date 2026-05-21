import { AppDataSource } from '../db/data-source';
import { Order, OrderStatus } from '../orders/order.entity';

async function seed() {
  await AppDataSource.initialize();
  console.log('📦 Database connected');

  const orderRepo = AppDataSource.getRepository(Order);

  const count = await orderRepo.count();
  if (count > 0) {
    console.log('⚠️  Orders table already has data, skipping seed');
    await AppDataSource.destroy();
    return;
  }

  await orderRepo.save([
    { productId: 1, quantity: 2, customerEmail: 'alice@test.com', status: OrderStatus.CONFIRMED },
    { productId: 2, quantity: 1, customerEmail: 'bob@test.com', status: OrderStatus.CONFIRMED },
    { productId: 3, quantity: 5, customerEmail: 'charlie@test.com', status: OrderStatus.PENDING },
  ]);

  console.log('🌱 Seeded 3 orders successfully');
  await AppDataSource.destroy();
  console.log('✅ Done');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});