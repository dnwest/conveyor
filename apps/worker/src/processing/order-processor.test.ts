import type { Message } from '@aws-sdk/client-sqs';
import { ORDER_CREATED, type Order } from '@conveyor/core';
import type CircuitBreaker from 'opossum';
import { pino } from 'pino';
import { describe, expect, it, vi } from 'vitest';
import { OrderProcessor } from './order-processor';
import type { ProcessingLog } from './processing-log';

const silentLogger = pino({ level: 'silent' });

const retryOptions = { retries: 1, baseDelayMs: 1, maxDelayMs: 1 };

const order: Order = {
  id: '11111111-1111-4111-8111-111111111111',
  customerId: 'cus_1',
  items: [{ sku: 'SKU-1', quantity: 1, unitPriceCents: 100 }],
  status: 'pending',
  totalCents: 100,
  createdAt: '2026-06-24T00:00:00.000Z',
  updatedAt: '2026-06-24T00:00:00.000Z',
};

const message = {
  Body: JSON.stringify({ type: ORDER_CREATED, occurredAt: '2026-06-24T00:00:00.000Z', order }),
} as Message;

function fakeBreaker(fire: (order: Order) => Promise<boolean>): CircuitBreaker<[Order], boolean> {
  return { fire } as unknown as CircuitBreaker<[Order], boolean>;
}

function fakeLog(): ProcessingLog {
  return { recordFailure: vi.fn().mockResolvedValue(undefined) };
}

describe('OrderProcessor', () => {
  it('does not record a failure when the order is processed', async () => {
    const log = fakeLog();
    const processor = new OrderProcessor(
      fakeBreaker(async () => true),
      retryOptions,
      log,
      silentLogger,
    );

    await expect(processor.process(message)).resolves.toBeUndefined();
    expect(log.recordFailure).not.toHaveBeenCalled();
  });

  it('records a failure and rethrows after retries are exhausted', async () => {
    const log = fakeLog();
    const processor = new OrderProcessor(
      fakeBreaker(async () => {
        throw new Error('downstream down');
      }),
      retryOptions,
      log,
      silentLogger,
    );

    await expect(processor.process(message)).rejects.toThrow('downstream down');
    expect(log.recordFailure).toHaveBeenCalledTimes(1);
    expect(log.recordFailure).toHaveBeenCalledWith(
      order.id,
      retryOptions.retries + 1,
      'downstream down',
    );
  });
});
