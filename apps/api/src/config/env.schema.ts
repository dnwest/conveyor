import { z } from 'zod';

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

    DATABASE_URL: z.string().url(),

    ORDER_EVENTS_TRANSPORT: z.enum(['memory', 'sns']).default('memory'),
    ORDERS_TOPIC_ARN: z.string().optional(),

    ORDERS_QUEUE_URL: z.string().url(),
    ORDERS_DLQ_URL: z.string().url(),

    AWS_REGION: z.string().min(1).default('us-east-1'),
    AWS_ENDPOINT_URL: z.string().url().optional(),
    AWS_ACCESS_KEY_ID: z.string().min(1).default('test'),
    AWS_SECRET_ACCESS_KEY: z.string().min(1).default('test'),
  })
  .refine((env) => env.ORDER_EVENTS_TRANSPORT !== 'sns' || Boolean(env.ORDERS_TOPIC_ARN), {
    message: 'ORDERS_TOPIC_ARN is required when ORDER_EVENTS_TRANSPORT=sns',
    path: ['ORDERS_TOPIC_ARN'],
  });

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  return envSchema.parse(config);
}
