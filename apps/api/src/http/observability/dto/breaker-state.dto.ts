import {
  BREAKER_STATES,
  type BreakerState,
  type BreakerStatus,
  type BreakerStatusList,
} from '@conveyor/core';
import { ApiProperty } from '@nestjs/swagger';

export class BreakerStatusDto implements BreakerStatus {
  @ApiProperty({ description: 'Breaker name', example: 'order-fulfillment' })
  name!: string;

  @ApiProperty({ enum: BREAKER_STATES, description: 'State as of the last recorded transition' })
  state!: BreakerState;

  @ApiProperty({ description: 'When the breaker moved into this state (ISO 8601)' })
  changedAt!: string;
}

export class BreakerStatusListDto implements BreakerStatusList {
  @ApiProperty({
    type: [BreakerStatusDto],
    description: 'Empty until a breaker records its first transition',
  })
  breakers!: BreakerStatusDto[];
}
