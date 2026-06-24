import { deadLetters, orders, type Database } from '@conveyor/db';
import { and, eq, notInArray } from 'drizzle-orm';
import type { DeadLetterRecord, DeadLetterStore } from '../processing/dead-letter-store';

export class DrizzleDeadLetterStore implements DeadLetterStore {
  constructor(private readonly db: Database) {}

  async save(record: DeadLetterRecord): Promise<void> {
    await this.db.transaction(async (tx) => {
      const existing = await tx
        .select({ id: deadLetters.id })
        .from(deadLetters)
        .where(eq(deadLetters.messageId, record.messageId))
        .limit(1);

      if (existing.length > 0) {
        return;
      }

      await tx.insert(deadLetters).values({
        messageId: record.messageId,
        orderId: record.orderId,
        payload: record.payload,
        error: record.error,
        receiveCount: record.receiveCount,
      });

      if (record.orderId) {
        await tx
          .update(orders)
          .set({ status: 'dead_lettered', updatedAt: new Date() })
          .where(
            and(
              eq(orders.id, record.orderId),
              notInArray(orders.status, ['completed', 'dead_lettered']),
            ),
          );
      }
    });
  }
}
