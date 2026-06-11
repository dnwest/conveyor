import type { MetricsSummary } from '@conveyor/core';
import type { OrderQueries } from '../ports/order-queries';

export class GetMetricsSummaryUseCase {
  constructor(private readonly queries: OrderQueries) {}

  execute(): Promise<MetricsSummary> {
    return this.queries.summary();
  }
}
