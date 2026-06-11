import type { Order } from '@conveyor/core';
import { orders, type Database } from '@conveyor/db';
import { eq } from 'drizzle-orm';
import type { OrderRepository } from '../../core/ports/order.repository';
import { toOrderDomain, toOrderRow } from './order.mapper';

export class DrizzleOrderRepository implements OrderRepository {
  constructor(private readonly db: Database) {}

  async save(order: Order): Promise<void> {
    const row = toOrderRow(order);
    await this.db.insert(orders).values(row).onConflictDoUpdate({ target: orders.id, set: row });
  }

  async findById(id: string): Promise<Order | null> {
    const [row] = await this.db.select().from(orders).where(eq(orders.id, id)).limit(1);
    return row ? toOrderDomain(row) : null;
  }
}
