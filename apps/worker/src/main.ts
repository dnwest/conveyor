import { createSqsClient } from "./aws/sqs-client";
import { loadEnv } from "./config/env";
import { createLogger } from "./logger";
import { SqsConsumer } from "./messaging/sqs-consumer";
import { OrderProcessor } from "./processing/order-processor";

async function main(): Promise<void> {
  const env = loadEnv();
  const logger = createLogger(env.LOG_LEVEL, env.NODE_ENV !== "production");
  const client = createSqsClient(env);

  const processor = new OrderProcessor(
    {
      retries: env.MAX_PROCESSING_RETRIES,
      baseDelayMs: env.RETRY_BASE_DELAY_MS,
      maxDelayMs: env.RETRY_MAX_DELAY_MS,
    },
    logger,
  );

  const consumer = new SqsConsumer(
    client,
    {
      queueUrl: env.ORDERS_QUEUE_URL,
      waitTimeSeconds: env.POLL_WAIT_TIME_SECONDS,
      visibilityTimeoutSeconds: env.VISIBILITY_TIMEOUT_SECONDS,
      maxMessages: 10,
    },
    (message) => processor.process(message),
    logger,
  );

  const shutdown = (signal: string): void => {
    logger.info({ signal }, "received shutdown signal");
    consumer.stop();
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  await consumer.start();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
