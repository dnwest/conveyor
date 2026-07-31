import type { DeadLetterListResponse } from '@conveyor/core';
import type { DeadLetterQueries, ListDeadLettersParams } from '../ports/dead-letter-queries';

export class ListDeadLettersUseCase {
  constructor(private readonly queries: DeadLetterQueries) {}

  async execute(params: ListDeadLettersParams): Promise<DeadLetterListResponse> {
    const { items, total } = await this.queries.list(params);

    return { items, total, limit: params.limit, offset: params.offset };
  }
}
