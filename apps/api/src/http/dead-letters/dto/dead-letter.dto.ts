import type { DeadLetter } from '@conveyor/core';
import { ApiProperty } from '@nestjs/swagger';

export class DeadLetterDto implements DeadLetter {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ description: 'SQS message id the dead letter was drained from' })
  messageId!: string;

  @ApiProperty({
    format: 'uuid',
    nullable: true,
    description: 'Order the message referred to, when the payload could be parsed',
  })
  orderId!: string | null;

  @ApiProperty({ description: 'Raw message body, as it was received from the DLQ' })
  payload!: string;

  @ApiProperty({ nullable: true, description: 'Failure reported by the worker, when known' })
  error!: string | null;

  @ApiProperty({
    description: 'How many times SQS delivered the message before it was dead-lettered',
  })
  receiveCount!: number;

  @ApiProperty({ description: 'When the dead letter was recorded (ISO 8601)' })
  createdAt!: string;

  @ApiProperty({
    nullable: true,
    description: 'When the message was replayed to the orders queue (ISO 8601)',
  })
  replayedAt!: string | null;
}
