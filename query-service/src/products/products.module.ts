import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ProductsResolver } from './products.resolver';
import { ProductsService } from './products.service';

@Module({
  imports: [HttpModule],
  providers: [ProductsResolver, ProductsService],
})
export class ProductsModule {}