import type { OrderCreatedMessage } from '@conveyor/core';

export interface OrderEventPublisher {
  publishOrderCreated(message: OrderCreatedMessage): Promise<void>;
}
