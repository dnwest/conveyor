import type { Order } from '@conveyor/core';
import { Injectable } from '@nestjs/common';
import type { OrderRepository } from '../../core/ports/order.repository';

@Injectable()
export class InMemoryOrderRepository implements OrderRepository {
  private readonly store = new Map<string, Order>();

  async save(order: Order): Promise<void> {
    this.store.set(order.id, order);
  }

  async findById(id: string): Promise<Order | null> {
    return this.store.get(id) ?? null;
  }
}
