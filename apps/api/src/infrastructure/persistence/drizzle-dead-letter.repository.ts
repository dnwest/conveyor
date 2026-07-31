import type { DeadLetter } from '@conveyor/core';
import { deadLetters, type Database } from '@conveyor/db';
import { and, eq, isNull } from 'drizzle-orm';
import { DeadLetterAlreadyReplayedError, DeadLetterNotFoundError } from '../../core/errors';
import type { DeadLetterRepository } from '../../core/ports/dead-letter.repository';
import { toDeadLetterDomain } from './dead-letter.mapper';

export class DrizzleDeadLetterRepository implements DeadLetterRepository {
  constructor(private readonly db: Database) {}

  async markReplayed(id: string, replayedAt: Date): Promise<DeadLetter> {
    // Guarding on `replayed_at is null` keeps two concurrent replays from both
    // stamping the row — the loser gets the same 409 as a repeated request.
    const [row] = await this.db
      .update(deadLetters)
      .set({ replayedAt })
      .where(and(eq(deadLetters.id, id), isNull(deadLetters.replayedAt)))
      .returning();

    if (!row) {
      throw await this.conflict(id);
    }

    return toDeadLetterDomain(row);
  }

  private async conflict(id: string): Promise<Error> {
    const [row] = await this.db.select().from(deadLetters).where(eq(deadLetters.id, id)).limit(1);

    return row?.replayedAt
      ? new DeadLetterAlreadyReplayedError(id, row.replayedAt.toISOString())
      : new DeadLetterNotFoundError(id);
  }
}
