import type { BreakerStatus } from '@conveyor/core';

export interface BreakerStateQueries {
  // Latest recorded transition per breaker. The breaker itself lives in the
  // worker process, so the API reads the state it persisted.
  current(): Promise<BreakerStatus[]>;
}
