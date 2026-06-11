import { ORDER_CREATED, type CreateOrderRequest, type Order } from '@conveyor/core';
import { createOrder } from '../domain/order.factory';
import type { OrderEventPublisher } from '../ports/order-event.publisher';
import type { OrderRepository } from '../ports/order.repository';

export class CreateOrderUseCase {
  constructor(
    private readonly orders: OrderRepository,
    private readonly publisher: OrderEventPublisher,
  ) {}

  async execute(request: CreateOrderRequest): Promise<Order> {
    const order = createOrder(request);
    await this.orders.save(order);
    await this.publisher.publishOrderCreated({
      type: ORDER_CREATED,
      occurredAt: order.createdAt,
      order,
    });
    return order;
  }
}
