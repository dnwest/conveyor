import type { ThroughputPoint, ThroughputSeries } from '@conveyor/core';
import { ApiProperty } from '@nestjs/swagger';

export class ThroughputPointDto implements ThroughputPoint {
  @ApiProperty({
    description: 'Start of the bucket (ISO 8601)',
    example: '2026-06-23T14:00:00.000Z',
  })
  bucket!: string;

  @ApiProperty({ description: 'Orders successfully processed within the bucket' })
  completed!: number;

  @ApiProperty({ description: 'Orders that exhausted their retries within the bucket' })
  failed!: number;
}

export class ThroughputSeriesDto implements ThroughputSeries {
  @ApiProperty({ description: 'Size of the reported window, in minutes' })
  windowMinutes!: number;

  @ApiProperty({ description: 'Width of each bucket, in minutes' })
  bucketMinutes!: number;

  @ApiProperty({ type: [ThroughputPointDto], description: 'Buckets oldest-first, zero-filled' })
  points!: ThroughputPointDto[];
}
