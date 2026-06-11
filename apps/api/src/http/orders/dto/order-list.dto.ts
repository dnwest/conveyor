import type { OrderListResponse } from '@conveyor/core';
import { ApiProperty } from '@nestjs/swagger';
import { OrderDto } from './order.dto';

export class OrderListDto implements OrderListResponse {
  @ApiProperty({ type: [OrderDto] })
  items!: OrderDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  offset!: number;
}
