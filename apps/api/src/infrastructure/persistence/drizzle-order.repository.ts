import type { Order } from '@conveyor/core';
import { orders, type Database } from '@conveyor/db';
import { eq } from 'drizzle-orm';
import type { OrderRepository } from '../../core/ports/order.repository';

export class DrizzleOrderRepository implements OrderRepository {
  constructor(private readonly db: Database) {}

  async save(order: Order): Promise<void> {
    const row = this.toRow(order);
    await this.db.insert(orders).values(row).onConflictDoUpdate({ target: orders.id, set: row });
  }

  async findById(id: string): Promise<Order | null> {
    const [row] = await this.db.select().from(orders).where(eq(orders.id, id)).limit(1);
    return row ? this.toDomain(row) : null;
  }

  private toRow(order: Order): typeof orders.$inferInsert {
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

  private toDomain(row: typeof orders.$inferSelect): Order {
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
}
