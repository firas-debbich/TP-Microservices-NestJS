import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsPositive, Min } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Laptop' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 1200.00 })
  @IsNumber()
  @IsPositive()
  price: number;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @Min(0)
  stock: number;
}

// PartialType makes all fields from CreateProductDto optional
// perfect for PATCH — client can send only the fields they want to update
export class UpdateProductDto extends PartialType(CreateProductDto) {}