import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const port = process.env.PORT || 3003;
  await app.listen(port);
  console.log(`🔎 Query Service running on http://localhost:${port}`);
  console.log(`🚀 GraphQL Playground at http://localhost:${port}/graphql`);
}
bootstrap();