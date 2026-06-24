import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
  type Message,
  type SQSClient,
} from '@aws-sdk/client-sqs';
import { ORDER_CREATED, type Order } from '@conveyor/core';
import { pino } from 'pino';
import { describe, expect, it, vi } from 'vitest';
import { DlqDrainer, toDeadLetterRecord } from './dlq-drainer';
import type { DeadLetterStore } from '../processing/dead-letter-store';

const silentLogger = pino({ level: 'silent' });

const order: Order = {
  id: '11111111-1111-4111-8111-111111111111',
  customerId: 'cus_1',
  items: [{ sku: 'SKU-1', quantity: 1, unitPriceCents: 100 }],
  status: 'pending',
  totalCents: 100,
  createdAt: '2026-06-24T00:00:00.000Z',
  updatedAt: '2026-06-24T00:00:00.000Z',
};

const body = JSON.stringify({ type: ORDER_CREATED, occurredAt: '2026-06-24T00:00:00.000Z', order });

describe('toDeadLetterRecord', () => {
  it('extracts orderId and receiveCount from a valid message', () => {
    const record = toDeadLetterRecord({
      MessageId: 'm1',
      Body: body,
      Attributes: { ApproximateReceiveCount: '3' },
    } as Message);

    expect(record).toEqual({
      messageId: 'm1',
      orderId: order.id,
      payload: body,
      error: null,
      receiveCount: 3,
    });
  });

  it('falls back to a null orderId for an unparseable body', () => {
    const record = toDeadLetterRecord({ MessageId: 'm2', Body: 'not-json' } as Message);

    expect(record.orderId).toBeNull();
    expect(record.receiveCount).toBe(0);
  });
});

describe('DlqDrainer', () => {
  it('persists a dead letter then deletes it from the DLQ', async () => {
    const store: DeadLetterStore = { save: vi.fn().mockResolvedValue(undefined) };
    const message = {
      MessageId: 'm1',
      Body: body,
      ReceiptHandle: 'rh-1',
      Attributes: { ApproximateReceiveCount: '3' },
    } as Message;

    let stop = (): void => {};
    const send = vi.fn(async (command: unknown) => {
      if (command instanceof ReceiveMessageCommand) {
        stop();
        return { Messages: [message] };
      }
      return {};
    });
    const client = { send } as unknown as SQSClient;

    const drainer = new DlqDrainer(
      client,
      {
        queueUrl: 'http://localhost:4566/000000000000/orders-dlq',
        waitTimeSeconds: 0,
        maxMessages: 10,
      },
      store,
      silentLogger,
    );
    stop = (): void => drainer.stop();

    await drainer.start();

    expect(store.save).toHaveBeenCalledWith(toDeadLetterRecord(message));
    const deleteCalls = send.mock.calls.filter(
      ([command]) => command instanceof DeleteMessageCommand,
    );
    expect(deleteCalls).toHaveLength(1);
  });
});
