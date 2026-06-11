import type { MetricsSummary, OrderStatus } from '@conveyor/core';
import { ApiProperty } from '@nestjs/swagger';

export class MetricsSummaryDto implements MetricsSummary {
  @ApiProperty({ description: 'Total number of orders' })
  total!: number;

  @ApiProperty({
    description: 'Order count per status',
    example: { pending: 2, processing: 0, completed: 5, failed: 0, dead_lettered: 1 },
  })
  statusCounts!: Record<OrderStatus, number>;

  @ApiProperty({ description: 'Orders successfully processed in the last hour' })
  processedLastHour!: number;
}
