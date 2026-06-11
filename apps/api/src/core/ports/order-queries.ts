import type { MetricsSummary, Order, OrderStatus } from '@conveyor/core';

export interface ListOrdersParams {
  limit: number;
  offset: number;
  status?: OrderStatus;
}

export interface OrderQueries {
  list(params: ListOrdersParams): Promise<{ items: Order[]; total: number }>;
  summary(): Promise<MetricsSummary>;
}
