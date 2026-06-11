import type { Order } from '@conveyor/core';

export interface OrderFulfillment {
  // Resolves true when this call performed the work, false when the order was
  // already completed (idempotent no-op under at-least-once delivery).
  fulfill(order: Order): Promise<boolean>;
}
