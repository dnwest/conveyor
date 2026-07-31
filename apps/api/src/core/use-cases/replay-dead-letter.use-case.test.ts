import { ORDER_CREATED, type DeadLetter, type OrderCreatedMessage } from '@conveyor/core';
import { describe, expect, it } from 'vitest';
import {
  DeadLetterAlreadyReplayedError,
  DeadLetterNotFoundError,
  DeadLetterNotReplayableError,
} from '../errors';
import type { DeadLetterQueries } from '../ports/dead-letter-queries';
import type { DeadLetterReplayer } from '../ports/dead-letter-replayer';
import type { DeadLetterRepository } from '../ports/dead-letter.repository';
import { ReplayDeadLetterUseCase } from './replay-dead-letter.use-case';

const ORDER_ID = '3f1d2c4e-9b7a-4a1e-8f2d-0c5b6a7d8e9f';
const DEAD_LETTER_ID = '8a2b1c3d-4e5f-4a6b-9c8d-7e6f5a4b3c2d';

const message: OrderCreatedMessage = {
  type: ORDER_CREATED,
  occurredAt: '2026-06-24T12:00:00.000Z',
  order: {
    id: ORDER_ID,
    customerId: 'cus_1',
    items: [{ sku: 'SKU-1', quantity: 1, unitPriceCents: 500 }],
    status: 'dead_lettered',
    totalCents: 500,
    createdAt: '2026-06-24T12:00:00.000Z',
    updatedAt: '2026-06-24T12:00:00.000Z',
  },
};

function deadLetter(overrides: Partial<DeadLetter> = {}): DeadLetter {
  return {
    id: DEAD_LETTER_ID,
    messageId: 'msg-1',
    orderId: ORDER_ID,
    payload: JSON.stringify(message),
    error: 'downstream unavailable',
    receiveCount: 3,
    createdAt: '2026-06-24T12:00:05.000Z',
    replayedAt: null,
    ...overrides,
  };
}

class FakeDeadLetterQueries implements DeadLetterQueries {
  constructor(private readonly stored: DeadLetter | null) {}

  async list(): Promise<{ items: DeadLetter[]; total: number }> {
    const items = this.stored ? [this.stored] : [];

    return { items, total: items.length };
  }

  async findById(id: string): Promise<DeadLetter | null> {
    return this.stored?.id === id ? this.stored : null;
  }
}

class FakeDeadLetterRepository implements DeadLetterRepository {
  readonly marked: string[] = [];

  constructor(private readonly stored: DeadLetter) {}

  async markReplayed(id: string, replayedAt: Date): Promise<DeadLetter> {
    this.marked.push(id);

    return { ...this.stored, replayedAt: replayedAt.toISOString() };
  }
}

class CapturingReplayer implements DeadLetterReplayer {
  readonly replayed: OrderCreatedMessage[] = [];

  async replay(message: OrderCreatedMessage): Promise<void> {
    this.replayed.push(message);
  }
}

function buildUseCase(stored: DeadLetter | null) {
  const queries = new FakeDeadLetterQueries(stored);
  const repository = new FakeDeadLetterRepository(stored ?? deadLetter());
  const replayer = new CapturingReplayer();

  return {
    useCase: new ReplayDeadLetterUseCase(queries, repository, replayer),
    repository,
    replayer,
  };
}

describe('ReplayDeadLetterUseCase', () => {
  it('sends the message back to the queue and stamps the replay', async () => {
    const { useCase, repository, replayer } = buildUseCase(deadLetter());

    const result = await useCase.execute(DEAD_LETTER_ID);

    expect(replayer.replayed).toEqual([message]);
    expect(repository.marked).toEqual([DEAD_LETTER_ID]);
    expect(result.replayedAt).not.toBeNull();
  });

  it('rejects an unknown dead letter', async () => {
    const { useCase, replayer } = buildUseCase(null);

    await expect(useCase.execute(DEAD_LETTER_ID)).rejects.toThrow(DeadLetterNotFoundError);
    expect(replayer.replayed).toHaveLength(0);
  });

  it('refuses to replay the same dead letter twice', async () => {
    const { useCase, replayer } = buildUseCase(
      deadLetter({ replayedAt: '2026-06-24T12:10:00.000Z' }),
    );

    await expect(useCase.execute(DEAD_LETTER_ID)).rejects.toThrow(DeadLetterAlreadyReplayedError);
    expect(replayer.replayed).toHaveLength(0);
  });

  it('refuses a payload that is not a replayable order event', async () => {
    const { useCase, repository, replayer } = buildUseCase(deadLetter({ payload: 'not json' }));

    await expect(useCase.execute(DEAD_LETTER_ID)).rejects.toThrow(DeadLetterNotReplayableError);
    expect(replayer.replayed).toHaveLength(0);
    expect(repository.marked).toHaveLength(0);
  });
});
