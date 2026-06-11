import { z } from 'zod';
import { orderSchema } from '../domain/order';

export const ORDER_CREATED = 'order.created' as const;

export const orderCreatedMessageSchema = z.object({
  type: z.literal(ORDER_CREATED),
  occurredAt: z.string().datetime(),
  order: orderSchema,
});
export type OrderCreatedMessage = z.infer<typeof orderCreatedMessageSchema>;
