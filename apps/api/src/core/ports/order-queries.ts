import type { MetricsSummary, Order, OrderStatus, ThroughputSeries } from '@conveyor/core';

export interface ListOrdersParams {
  limit: number;
  offset: number;
  status?: OrderStatus;
}

export interface ThroughputParams {
  windowMinutes: number;
  bucketMinutes: number;
}

export interface OrderQueries {
  list(params: ListOrdersParams): Promise<{ items: Order[]; total: number }>;
  summary(): Promise<MetricsSummary>;
  throughput(params: ThroughputParams): Promise<ThroughputSeries>;
}
