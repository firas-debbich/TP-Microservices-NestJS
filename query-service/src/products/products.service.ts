import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { ProductType } from './product.type';

@Injectable()
export class ProductsService {
  private readonly catalogUrl: string;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.catalogUrl = this.config.getOrThrow<string>('CATALOG_SERVICE_URL');
  }

  async findAll(): Promise<ProductType[]> {
    try {
      const { data } = await firstValueFrom(
        this.http.get<ProductType[]>(`${this.catalogUrl}/products`),
      );
      return data;
    } catch (err) {
      console.error('❌ Failed to reach catalog-service:', err.message);
      return [];
    }
  }

  async findOne(id: number): Promise<ProductType | null> {
    try {
      const { data } = await firstValueFrom(
        this.http.get<ProductType>(`${this.catalogUrl}/products/${id}`),
      );
      return data;
    } catch {
      return null;
    }
  }
}