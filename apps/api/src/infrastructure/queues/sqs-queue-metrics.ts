import { GetQueueAttributesCommand, type SQSClient } from '@aws-sdk/client-sqs';
import type { QueueDepth, QueueDepths } from '@conveyor/core';
import type { QueueMetrics } from '../../core/ports/queue-metrics';

export class SqsQueueMetrics implements QueueMetrics {
  constructor(
    private readonly client: SQSClient,
    private readonly queueUrl: string,
    private readonly deadLetterUrl: string,
  ) {}

  async getDepths(): Promise<QueueDepths> {
    const [queue, deadLetter] = await Promise.all([
      this.depth(this.queueUrl),
      this.depth(this.deadLetterUrl),
    ]);

    return { queue, deadLetter };
  }

  private async depth(queueUrl: string): Promise<QueueDepth> {
    const result = await this.client.send(
      new GetQueueAttributesCommand({
        QueueUrl: queueUrl,
        AttributeNames: ['ApproximateNumberOfMessages', 'ApproximateNumberOfMessagesNotVisible'],
      }),
    );

    return {
      available: Number(result.Attributes?.ApproximateNumberOfMessages ?? 0),
      inFlight: Number(result.Attributes?.ApproximateNumberOfMessagesNotVisible ?? 0),
    };
  }
}
