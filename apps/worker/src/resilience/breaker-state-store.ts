import type { BreakerState } from '@conveyor/core';

export type { BreakerState };

export interface BreakerStateStore {
  // Records a circuit-breaker state transition so the current state can be
  // surfaced through the API (the breaker itself lives in the worker process).
  record(name: string, state: BreakerState): Promise<void>;
}
