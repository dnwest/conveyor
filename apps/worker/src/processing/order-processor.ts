import type { Message } from '@aws-sdk/client-sqs';
import { orderCreatedMessageSchema, type Order } from '@conveyor/core';
import type CircuitBreaker from 'opossum';
import type { Logger } from 'pino';
import { withRetry, type RetryOptions } from '../resilience/retry';

export class OrderProcessor {
  constructor(
    private readonly breaker: CircuitBreaker<[Order], boolean>,
    private readonly retryOptions: RetryOptions,
    private readonly logger: Logger,
  ) {}

  async process(message: Message): Promise<void> {
    const event = orderCreatedMessageSchema.parse(JSON.parse(message.Body ?? ''));
    const { order } = event;

    const processed = await withRetry(
      () => this.breaker.fire(order),
      this.retryOptions,
      (attempt, error, delayMs) =>
        this.logger.warn(
          { orderId: order.id, attempt, delayMs, err: error },
          'retrying order processing',
        ),
    );

    if (processed) {
      this.logger.info({ orderId: order.id, totalCents: order.totalCents }, 'order processed');
    } else {
      this.logger.info({ orderId: order.id }, 'order already processed; skipped (idempotent)');
    }
  }
}
