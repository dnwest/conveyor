import { orderCreatedMessageSchema, type DeadLetter } from '@conveyor/core';
import {
  DeadLetterAlreadyReplayedError,
  DeadLetterNotFoundError,
  DeadLetterNotReplayableError,
} from '../errors';
import type { DeadLetterQueries } from '../ports/dead-letter-queries';
import type { DeadLetterReplayer } from '../ports/dead-letter-replayer';
import type { DeadLetterRepository } from '../ports/dead-letter.repository';

export class ReplayDeadLetterUseCase {
  constructor(
    private readonly queries: DeadLetterQueries,
    private readonly deadLetters: DeadLetterRepository,
    private readonly replayer: DeadLetterReplayer,
  ) {}

  async execute(id: string): Promise<DeadLetter> {
    const deadLetter = await this.queries.findById(id);
    if (!deadLetter) {
      throw new DeadLetterNotFoundError(id);
    }
    if (deadLetter.replayedAt) {
      throw new DeadLetterAlreadyReplayedError(id, deadLetter.replayedAt);
    }

    await this.replayer.replay(parsePayload(deadLetter));

    return this.deadLetters.markReplayed(id, new Date());
  }
}

// A poison message may be unparseable garbage: replaying it would only send it
// straight back to the DLQ, so it is rejected instead.
function parsePayload(deadLetter: DeadLetter) {
  let json: unknown;
  try {
    json = JSON.parse(deadLetter.payload);
  } catch {
    throw new DeadLetterNotReplayableError(deadLetter.id, 'payload is not valid JSON');
  }

  const parsed = orderCreatedMessageSchema.safeParse(json);
  if (!parsed.success) {
    throw new DeadLetterNotReplayableError(deadLetter.id, 'payload is not an order.created event');
  }

  return parsed.data;
}
