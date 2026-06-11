import type { CreateOrderRequest, OrderItem } from '@conveyor/core';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

class OrderItemDto implements OrderItem {
  @ApiProperty({ example: 'SKU-123' })
  @IsString()
  @MinLength(1)
  sku!: string;

  @ApiProperty({ example: 2, minimum: 1 })
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiProperty({ example: 1999, description: 'Unit price in cents' })
  @IsInt()
  @Min(0)
  unitPriceCents!: number;
}

export class CreateOrderDto implements CreateOrderRequest {
  @ApiProperty({ example: 'cus_123' })
  @IsString()
  @MinLength(1)
  customerId!: string;

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];
}
