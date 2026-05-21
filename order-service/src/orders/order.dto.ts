import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsInt, IsPositive, IsNotEmpty } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsPositive()
  productId: number;

  @ApiProperty({ example: 2 })
  @IsInt()
  @IsPositive()
  quantity: number;

  @ApiProperty({ example: 'client@test.com' })
  @IsEmail()
  @IsNotEmpty()
  customerEmail: string;
}