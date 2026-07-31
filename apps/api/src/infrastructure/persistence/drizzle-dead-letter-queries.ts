import type { DeadLetter } from '@conveyor/core';
import { deadLetters, type Database } from '@conveyor/db';
import { desc, eq, sql } from 'drizzle-orm';
import type {
  DeadLetterQueries,
  ListDeadLettersParams,
} from '../../core/ports/dead-letter-queries';
import { toDeadLetterDomain } from './dead-letter.mapper';

export class DrizzleDeadLetterQueries implements DeadLetterQueries {
  constructor(private readonly db: Database) {}

  async list(params: ListDeadLettersParams): Promise<{ items: DeadLetter[]; total: number }> {
    const rows = await this.db
      .select()
      .from(deadLetters)
      .orderBy(desc(deadLetters.createdAt))
      .limit(params.limit)
      .offset(params.offset);

    const [counted] = await this.db.select({ total: sql<number>`count(*)::int` }).from(deadLetters);

    return { items: rows.map(toDeadLetterDomain), total: counted?.total ?? 0 };
  }

  async findById(id: string): Promise<DeadLetter | null> {
    const [row] = await this.db.select().from(deadLetters).where(eq(deadLetters.id, id)).limit(1);

    return row ? toDeadLetterDomain(row) : null;
  }
}
