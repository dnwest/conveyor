import type { DeadLetterListResponse } from '@conveyor/core';
import { ApiProperty } from '@nestjs/swagger';
import { DeadLetterDto } from './dead-letter.dto';

export class DeadLetterListDto implements DeadLetterListResponse {
  @ApiProperty({ type: [DeadLetterDto] })
  items!: DeadLetterDto[];

  @ApiProperty({ description: 'Total dead letters recorded' })
  total!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  offset!: number;
}
