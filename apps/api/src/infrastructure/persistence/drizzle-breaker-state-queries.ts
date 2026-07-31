import { breakerStateSchema, type BreakerStatus } from '@conveyor/core';
import { metrics, type Database } from '@conveyor/db';
import { desc, eq, sql } from 'drizzle-orm';
import type { BreakerStateQueries } from '../../core/ports/breaker-state-queries';

const BREAKER_METRIC = 'circuit_breaker';

export class DrizzleBreakerStateQueries implements BreakerStateQueries {
  constructor(private readonly db: Database) {}

  async current(): Promise<BreakerStatus[]> {
    const name = sql<string>`${metrics.labels}->>'breaker'`;
    const state = sql<string>`${metrics.labels}->>'state'`;

    // The worker appends a row per transition; the newest one per breaker is
    // the current state.
    const rows = await this.db
      .selectDistinctOn([name], {
        name: name.as('breaker_name'),
        state: state.as('breaker_state'),
        changedAt: metrics.recordedAt,
      })
      .from(metrics)
      .where(eq(metrics.name, BREAKER_METRIC))
      .orderBy(name, desc(metrics.recordedAt));

    return rows.flatMap((row) => {
      const parsed = breakerStateSchema.safeParse(row.state);

      return parsed.success
        ? [{ name: row.name, state: parsed.data, changedAt: row.changedAt.toISOString() }]
        : [];
    });
  }
}
