import { metrics, type Database } from '@conveyor/db';
import type { BreakerState, BreakerStateStore } from '../resilience/breaker-state-store';

const STATE_VALUE: Record<BreakerState, number> = {
  open: 1,
  half_open: 0.5,
  closed: 0,
};

export class DrizzleBreakerStateStore implements BreakerStateStore {
  constructor(private readonly db: Database) {}

  async record(name: string, state: BreakerState): Promise<void> {
    await this.db.insert(metrics).values({
      name: 'circuit_breaker',
      labels: { breaker: name, state },
      value: STATE_VALUE[state],
    });
  }
}
