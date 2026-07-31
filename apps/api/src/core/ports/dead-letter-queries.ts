import type { DeadLetter } from '@conveyor/core';

export interface ListDeadLettersParams {
  limit: number;
  offset: number;
}

export interface DeadLetterQueries {
  list(params: ListDeadLettersParams): Promise<{ items: DeadLetter[]; total: number }>;
  findById(id: string): Promise<DeadLetter | null>;
}
