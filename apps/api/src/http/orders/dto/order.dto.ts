import { ORDER_STATUSES, type Order, type OrderItem, type OrderStatus } from '@conveyor/core';
import { ApiProperty } from '@nestjs/swagger';

class OrderItemView implements OrderItem {
  @ApiProperty()
  sku!: string;

  @ApiProperty()
  quantity!: number;

  @ApiProperty()
  unitPriceCents!: number;
}

export class OrderDto implements Order {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  customerId!: string;

  @ApiProperty({ type: [OrderItemView] })
  items!: OrderItem[];

  @ApiProperty({ enum: ORDER_STATUSES })
  status!: OrderStatus;

  @ApiProperty({ description: 'Order total in cents' })
  totalCents!: number;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: string;
}
