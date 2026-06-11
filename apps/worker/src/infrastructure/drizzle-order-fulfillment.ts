import type { Order } from '@conveyor/core';
import { orders, processingLog, type Database } from '@conveyor/db';
import { and, eq, ne } from 'drizzle-orm';
import type { OrderFulfillment } from '../processing/order-fulfillment';

export class DrizzleOrderFulfillment implements OrderFulfillment {
  constructor(private readonly db: Database) {}

  async fulfill(order: Order): Promise<boolean> {
    return this.db.transaction(async (tx) => {
      const completed = await tx
        .update(orders)
        .set({ status: 'completed', updatedAt: new Date() })
        .where(and(eq(orders.id, order.id), ne(orders.status, 'completed')))
        .returning({ id: orders.id });

      if (completed.length === 0) {
        return false;
      }

      await tx.insert(processingLog).values({ orderId: order.id, status: 'succeeded' });
      return true;
    });
  }
}
