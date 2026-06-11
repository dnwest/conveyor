import { randomUUID } from 'node:crypto';
import type { CreateOrderRequest, Order } from '@conveyor/core';

export function createOrder(request: CreateOrderRequest): Order {
  const now = new Date().toISOString();
  const totalCents = request.items.reduce(
    (sum, item) => sum + item.unitPriceCents * item.quantity,
    0,
  );

  return {
    id: randomUUID(),
    customerId: request.customerId,
    items: request.items,
    status: 'pending',
    totalCents,
    createdAt: now,
    updatedAt: now,
  };
}
