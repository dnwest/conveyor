import { orderCreatedMessageSchema } from '@conveyor/core';
import type { Message } from '@aws-sdk/client-sqs';
import type { Logger } from 'pino';
import { withRetry, type RetryOptions } from '../resilience/retry';

export class OrderProcessor {
  constructor(
    private readonly retryOptions: RetryOptions,
    private readonly logger: Logger,
  ) {}

  async process(message: Message): Promise<void> {
    const event = orderCreatedMessageSchema.parse(JSON.parse(message.Body ?? ''));
    const { order } = event;

    await withRetry(
      () => this.handleOrder(order.id),
      this.retryOptions,
      (attempt, error, delayMs) =>
        this.logger.warn(
          { orderId: order.id, attempt, delayMs, err: error },
          'retrying order processing',
        ),
    );

    this.logger.info({ orderId: order.id, totalCents: order.totalCents }, 'order processed');
  }

  private async handleOrder(_orderId: string): Promise<void> {
    // Downstream side effect (persistence / notification) lands in a later stage.
  }
}
