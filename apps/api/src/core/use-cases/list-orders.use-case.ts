import type { OrderListResponse } from '@conveyor/core';
import type { ListOrdersParams, OrderQueries } from '../ports/order-queries';

export class ListOrdersUseCase {
  constructor(private readonly queries: OrderQueries) {}

  async execute(params: ListOrdersParams): Promise<OrderListResponse> {
    const { items, total } = await this.queries.list(params);
    return { items, total, limit: params.limit, offset: params.offset };
  }
}
