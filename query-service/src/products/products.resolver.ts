import { Resolver, Query, Args, ID } from '@nestjs/graphql';
import { ProductsService } from './products.service';
import { ProductType } from './product.type';

@Resolver(() => ProductType)
export class ProductsResolver {
  constructor(private readonly productsService: ProductsService) {}

  @Query(() => [ProductType], { name: 'products' })
  findAll(): Promise<ProductType[]> {
    return this.productsService.findAll();
  }

  @Query(() => ProductType, { name: 'productById', nullable: true })
  findOne(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<ProductType | null> {
    return this.productsService.findOne(Number(id));
  }
}