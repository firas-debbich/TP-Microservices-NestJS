import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        package: 'stock',
        protoPath: join(__dirname, '../proto/stock.proto'),
        url: `0.0.0.0:${process.env.GRPC_PORT || 5000}`,
      },
    },
  );

  await app.listen();
  console.log(`📦 Stock Service (gRPC) listening on port ${process.env.GRPC_PORT || 5000}`);
}
bootstrap();