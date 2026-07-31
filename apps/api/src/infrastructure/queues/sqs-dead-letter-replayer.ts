import { SendMessageCommand, type SQSClient } from '@aws-sdk/client-sqs';
import type { OrderCreatedMessage } from '@conveyor/core';
import type { DeadLetterReplayer } from '../../core/ports/dead-letter-replayer';

export class SqsDeadLetterReplayer implements DeadLetterReplayer {
  constructor(
    private readonly client: SQSClient,
    private readonly queueUrl: string,
  ) {}

  // Straight to the orders queue rather than back through SNS: a replay is a
  // redrive of one message, not a new domain event to fan out.
  async replay(message: OrderCreatedMessage): Promise<void> {
    await this.client.send(
      new SendMessageCommand({
        QueueUrl: this.queueUrl,
        MessageBody: JSON.stringify(message),
      }),
    );
  }
}
