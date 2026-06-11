import type { Order } from '@conveyor/core';
import { orders } from '@conveyor/db';

export function toOrderRow(order: Order): typeof orders.$inferInsert {
  return {
    id: order.id,
    customerId: order.customerId,
    items: order.items,
    status: order.status,
    totalCents: order.totalCents,
    createdAt: new Date(order.createdAt),
    updatedAt: new Date(order.updatedAt),
  };
}

export function toOrderDomain(row: typeof orders.$inferSelect): Order {
  return {
    id: row.id,
    customerId: row.customerId,
    items: row.items,
    status: row.status,
    totalCents: row.totalCents,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
