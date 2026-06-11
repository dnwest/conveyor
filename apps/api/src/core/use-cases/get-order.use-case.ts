import type { Order } from '@conveyor/core';
import { OrderNotFoundError } from '../errors';
import type { OrderRepository } from '../ports/order.repository';

export class GetOrderUseCase {
  constructor(private readonly orders: OrderRepository) {}

  async execute(id: string): Promise<Order> {
    const order = await this.orders.findById(id);
    if (!order) {
      throw new OrderNotFoundError(id);
    }
    return order;
  }
}
