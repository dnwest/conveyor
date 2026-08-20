import { deadLetterSchema, type DeadLetter } from '@conveyor/core';
import { apiPost } from './api';

export function replayDeadLetter(id: string): Promise<DeadLetter> {
  return apiPost(`/dead-letters/${id}/replay`, deadLetterSchema);
}
