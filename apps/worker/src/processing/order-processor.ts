import type { Message } from '@aws-sdk/client-sqs';
import { orderCreatedMessageSchema, type Order } from '@conveyor/core';
import type CircuitBreaker from 'opossum';
import type { Logger } from 'pino';
import { withRetry, type RetryOptions } from '../resilience/retry';
import type { ProcessingLog } from './processing-log';

export class OrderProcessor {
  constructor(
    private readonly breaker: CircuitBreaker<[Order], boolean>,
    private readonly retryOptions: RetryOptions,
    private readonly processingLog: ProcessingLog,
    private readonly logger: Logger,
  ) {}

  async process(message: Message): Promise<void> {
    const event = orderCreatedMessageSchema.parse(JSON.parse(message.Body ?? ''));
    const { order } = event;

    let processed: boolean;
    try {
      processed = await withRetry(
        () => this.breaker.fire(order),
        this.retryOptions,
        (attempt, error, delayMs) =>
          this.logger.warn(
            { orderId: order.id, attempt, delayMs, err: error },
            'retrying order processing',
          ),
      );
    } catch (error) {
      const attempts = this.retryOptions.retries + 1;
      await this.recordFailure(order.id, attempts, error);
      this.logger.error(
        { orderId: order.id, attempts, err: error },
        'order processing failed after retries',
      );
      throw error;
    }

    if (processed) {
      this.logger.info({ orderId: order.id, totalCents: order.totalCents }, 'order processed');
    } else {
      this.logger.info({ orderId: order.id }, 'order already processed; skipped (idempotent)');
    }
  }

  // Failure recording is best-effort: a logging error must not mask the
  // original processing error, which still drives SQS redrive to the DLQ.
  private async recordFailure(orderId: string, attempts: number, error: unknown): Promise<void> {
    try {
      await this.processingLog.recordFailure(orderId, attempts, toMessage(error));
    } catch (logError) {
      this.logger.error({ orderId, err: logError }, 'failed to record processing failure');
    }
  }
}

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
