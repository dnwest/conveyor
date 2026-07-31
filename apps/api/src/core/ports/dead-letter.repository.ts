import type { DeadLetter } from '@conveyor/core';

export interface DeadLetterRepository {
  // Stamps the replay so an operator sees what was already sent back to the
  // queue, and a second replay of the same message can be rejected.
  markReplayed(id: string, replayedAt: Date): Promise<DeadLetter>;
}
