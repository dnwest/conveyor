import { deadLetterSchema, type DeadLetter } from '@conveyor/core';
import { apiPost } from './api';

// Routed through the console's own server so the operator check and the
// service token both stay off the browser.
export function replayDeadLetter(id: string): Promise<DeadLetter> {
  return apiPost(`/api/dead-letters/${id}/replay`, deadLetterSchema, { sameOrigin: true });
}
