import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  DATABASE_URL: z.string().url(),

  AWS_REGION: z.string().min(1).default('us-east-1'),
  AWS_ENDPOINT_URL: z.string().url().optional(),
  AWS_ACCESS_KEY_ID: z.string().min(1).default('test'),
  AWS_SECRET_ACCESS_KEY: z.string().min(1).default('test'),

  ORDERS_QUEUE_URL: z.string().url(),

  MAX_PROCESSING_RETRIES: z.coerce.number().int().nonnegative().default(2),
  RETRY_BASE_DELAY_MS: z.coerce.number().int().positive().default(200),
  RETRY_MAX_DELAY_MS: z.coerce.number().int().positive().default(2000),
  POLL_WAIT_TIME_SECONDS: z.coerce.number().int().min(0).max(20).default(20),
  VISIBILITY_TIMEOUT_SECONDS: z.coerce.number().int().positive().default(30),

  BREAKER_TIMEOUT_MS: z.coerce.number().int().positive().default(3000),
  BREAKER_ERROR_THRESHOLD_PCT: z.coerce.number().int().min(1).max(100).default(50),
  BREAKER_RESET_TIMEOUT_MS: z.coerce.number().int().positive().default(10000),
  BREAKER_VOLUME_THRESHOLD: z.coerce.number().int().positive().default(5),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  return envSchema.parse(source);
}
