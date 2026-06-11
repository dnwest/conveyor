import type { Order } from '@conveyor/core';
import { describe, expect, it } from 'vitest';
import type { OrderEventPublisher } from '../ports/order-event.publisher';
import type { OrderRepository } from '../ports/order.repository';
import { CreateOrderUseCase } from './create-order.use-case';

class FakeOrderRepository implements OrderRepository {
  readonly saved: Order[] = [];

  async save(order: Order): Promise<void> {
    this.saved.push(order);
  }

  async findById(id: string): Promise<Order | null> {
    return this.saved.find((order) => order.id === id) ?? null;
  }
}

class CapturingPublisher implements OrderEventPublisher {
  publishedCount = 0;

  async publishOrderCreated(): Promise<void> {
    this.publishedCount += 1;
  }
}

describe('CreateOrderUseCase', () => {
  it('persists the order and publishes an order.created event', async () => {
    const orders = new FakeOrderRepository();
    const publisher = new CapturingPublisher();
    const useCase = new CreateOrderUseCase(orders, publisher);

    const order = await useCase.execute({
      customerId: 'cus_1',
      items: [{ sku: 'SKU-1', quantity: 2, unitPriceCents: 500 }],
    });

    expect(order.status).toBe('pending');
    expect(order.totalCents).toBe(1000);
    expect(orders.saved).toHaveLength(1);
    expect(publisher.publishedCount).toBe(1);
  });
});
