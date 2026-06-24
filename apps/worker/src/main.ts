import type { Order } from '@conveyor/core';
import { createDatabase } from '@conveyor/db';
import { createSqsClient } from './aws/sqs-client';
import { loadEnv } from './config/env';
import { createLogger } from './logger';
import { DlqDrainer } from './messaging/dlq-drainer';
import { SqsConsumer } from './messaging/sqs-consumer';
import { DrizzleBreakerStateStore } from './infrastructure/drizzle-breaker-state-store';
import { DrizzleDeadLetterStore } from './infrastructure/drizzle-dead-letter-store';
import { DrizzleOrderFulfillment } from './infrastructure/drizzle-order-fulfillment';
import { DrizzleProcessingLog } from './infrastructure/drizzle-processing-log';
import { OrderProcessor } from './processing/order-processor';
import { createBreaker } from './resilience/circuit-breaker';

async function main(): Promise<void> {
  const env = loadEnv();
  const logger = createLogger(env.LOG_LEVEL, env.NODE_ENV !== 'production');
  const sqs = createSqsClient(env);
  const { db, close } = createDatabase(env.DATABASE_URL);

  const fulfillment = new DrizzleOrderFulfillment(db);
  const processingLog = new DrizzleProcessingLog(db);
  const deadLetterStore = new DrizzleDeadLetterStore(db);
  const breakerStateStore = new DrizzleBreakerStateStore(db);
  const breaker = createBreaker(
    'order-fulfillment',
    (order: Order) => fulfillment.fulfill(order),
    {
      timeoutMs: env.BREAKER_TIMEOUT_MS,
      errorThresholdPercentage: env.BREAKER_ERROR_THRESHOLD_PCT,
      resetTimeoutMs: env.BREAKER_RESET_TIMEOUT_MS,
      volumeThreshold: env.BREAKER_VOLUME_THRESHOLD,
    },
    logger,
    (state) => {
      void breakerStateStore.record('order-fulfillment', state).catch((error: unknown) => {
        logger.error({ err: error }, 'failed to record breaker state');
      });
    },
  );

  const processor = new OrderProcessor(
    breaker,
    {
      retries: env.MAX_PROCESSING_RETRIES,
      baseDelayMs: env.RETRY_BASE_DELAY_MS,
      maxDelayMs: env.RETRY_MAX_DELAY_MS,
    },
    processingLog,
    logger,
  );

  const consumer = new SqsConsumer(
    sqs,
    {
      queueUrl: env.ORDERS_QUEUE_URL,
      waitTimeSeconds: env.POLL_WAIT_TIME_SECONDS,
      visibilityTimeoutSeconds: env.VISIBILITY_TIMEOUT_SECONDS,
      maxMessages: 10,
    },
    (message) => processor.process(message),
    logger,
  );

  const dlqDrainer = new DlqDrainer(
    sqs,
    {
      queueUrl: env.ORDERS_DLQ_URL,
      waitTimeSeconds: env.POLL_WAIT_TIME_SECONDS,
      maxMessages: 10,
    },
    deadLetterStore,
    logger,
  );

  let shuttingDown = false;
  const shutdown = (signal: string): void => {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;
    logger.info({ signal }, 'received shutdown signal');
    consumer.stop();
    dlqDrainer.stop();
    breaker.shutdown();
    void close();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  await Promise.all([consumer.start(), dlqDrainer.start()]);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
