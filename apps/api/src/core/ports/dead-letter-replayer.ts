import type { OrderCreatedMessage } from '@conveyor/core';

export interface DeadLetterReplayer {
  // Puts the message back on the orders queue, where the worker picks it up
  // through the same path it took the first time.
  replay(message: OrderCreatedMessage): Promise<void>;
}
