import type { ThroughputSeries } from '@conveyor/core';
import type { OrderQueries, ThroughputParams } from '../ports/order-queries';

export class GetThroughputUseCase {
  constructor(private readonly queries: OrderQueries) {}

  execute(params: ThroughputParams): Promise<ThroughputSeries> {
    return this.queries.throughput(params);
  }
}
