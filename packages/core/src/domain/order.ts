import { z } from 'zod';

export const ORDER_STATUSES = [
  'pending',
  'processing',
  'completed',
  'failed',
  'dead_lettered',
] as const;

export const orderStatusSchema = z.enum(ORDER_STATUSES);
export type OrderStatus = z.infer<typeof orderStatusSchema>;

export const orderItemSchema = z.object({
  sku: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPriceCents: z.number().int().nonnegative(),
});
export type OrderItem = z.infer<typeof orderItemSchema>;

export const orderSchema = z.object({
  id: z.string().uuid(),
  customerId: z.string().min(1),
  items: z.array(orderItemSchema).min(1),
  status: orderStatusSchema,
  totalCents: z.number().int().nonnegative(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Order = z.infer<typeof orderSchema>;
