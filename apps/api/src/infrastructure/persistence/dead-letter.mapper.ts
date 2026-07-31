import type { DeadLetter } from '@conveyor/core';
import { deadLetters } from '@conveyor/db';

export function toDeadLetterDomain(row: typeof deadLetters.$inferSelect): DeadLetter {
  return {
    id: row.id,
    messageId: row.messageId,
    orderId: row.orderId,
    payload: row.payload,
    error: row.error,
    receiveCount: row.receiveCount,
    createdAt: row.createdAt.toISOString(),
    replayedAt: row.replayedAt?.toISOString() ?? null,
  };
}
