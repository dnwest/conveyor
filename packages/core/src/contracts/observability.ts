import { z } from 'zod';
import { ORDER_STATUSES, orderSchema, type OrderStatus } from '../domain/order';

export const orderListResponseSchema = z.object({
  items: z.array(orderSchema),
  total: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  offset: z.number().int().nonnegative(),
});
export type OrderListResponse = z.infer<typeof orderListResponseSchema>;

const statusCountsSchema = z.object(
  Object.fromEntries(
    ORDER_STATUSES.map((status) => [status, z.number().int().nonnegative()]),
  ) as Record<OrderStatus, z.ZodNumber>,
);

export const metricsSummarySchema = z.object({
  total: z.number().int().nonnegative(),
  statusCounts: statusCountsSchema,
  processedLastHour: z.number().int().nonnegative(),
});
export type MetricsSummary = z.infer<typeof metricsSummarySchema>;

export const queueDepthSchema = z.object({
  available: z.number().int().nonnegative(),
  inFlight: z.number().int().nonnegative(),
});
export type QueueDepth = z.infer<typeof queueDepthSchema>;

export const queueDepthsSchema = z.object({
  queue: queueDepthSchema,
  deadLetter: queueDepthSchema,
});
export type QueueDepths = z.infer<typeof queueDepthsSchema>;
