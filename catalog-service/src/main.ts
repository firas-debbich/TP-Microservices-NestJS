import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Registers the ValidationPipe globally — applies to ALL endpoints automatically
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,            // strips any properties not defined in the DTO (extra fields are removed)
      forbidNonWhitelisted: true, // if a client sends an extra field, throw 400 instead of silently stripping it
      transform: true,            // automatically converts incoming JSON to the DTO class instance (e.g. string "1" → number 1)
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Catalog Service')
    .setDescription('Product catalog REST API')
    .setVersion('1.0')
    .addTag('products')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🛍️  Catalog Service running on http://localhost:${port}`);
  console.log(`📖  Swagger docs at http://localhost:${port}/api/docs`);
}
bootstrap();