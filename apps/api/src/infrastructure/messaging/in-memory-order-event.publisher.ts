import type { OrderCreatedMessage } from '@conveyor/core';
import { Injectable, Logger } from '@nestjs/common';
import type { OrderEventPublisher } from '../../core/ports/order-event.publisher';

@Injectable()
export class InMemoryOrderEventPublisher implements OrderEventPublisher {
  private readonly logger = new Logger(InMemoryOrderEventPublisher.name);

  async publishOrderCreated(message: OrderCreatedMessage): Promise<void> {
    this.logger.log({
      msg: 'order event published',
      type: message.type,
      orderId: message.order.id,
    });
  }
}
