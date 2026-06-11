import { z } from 'zod';
import { orderItemSchema, orderSchema } from '../domain/order';

export const createOrderRequestSchema = z.object({
  customerId: z.string().min(1),
  items: z.array(orderItemSchema).min(1),
});
export type CreateOrderRequest = z.infer<typeof createOrderRequestSchema>;

export const orderResponseSchema = orderSchema;
export type OrderResponse = z.infer<typeof orderResponseSchema>;
