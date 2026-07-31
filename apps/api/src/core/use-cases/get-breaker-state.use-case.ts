import type { BreakerStatusList } from '@conveyor/core';
import type { BreakerStateQueries } from '../ports/breaker-state-queries';

export class GetBreakerStateUseCase {
  constructor(private readonly queries: BreakerStateQueries) {}

  async execute(): Promise<BreakerStatusList> {
    return { breakers: await this.queries.current() };
  }
}
