import type { QueueDepth, QueueDepths } from '@conveyor/core';
import { ApiProperty } from '@nestjs/swagger';

class QueueDepthDto implements QueueDepth {
  @ApiProperty({ description: 'Messages available to receive' })
  available!: number;

  @ApiProperty({ description: 'Messages received but not yet deleted' })
  inFlight!: number;
}

export class QueueDepthsDto implements QueueDepths {
  @ApiProperty({ type: QueueDepthDto })
  queue!: QueueDepth;

  @ApiProperty({ type: QueueDepthDto })
  deadLetter!: QueueDepth;
}
