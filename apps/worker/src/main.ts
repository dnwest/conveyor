import type { Order } from '@conveyor/core';
import { createDatabase } from '@conveyor/db';
import { createSqsClient } from './aws/sqs-client';
import { loadEnv } from './config/env';
import { createLogger } from './logger';
import { SqsConsumer } from './messaging/sqs-consumer';
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

  let shuttingDown = false;
  const shutdown = (signal: string): void => {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;
    logger.info({ signal }, 'received shutdown signal');
    consumer.stop();
    breaker.shutdown();
    void close();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  await consumer.start();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
