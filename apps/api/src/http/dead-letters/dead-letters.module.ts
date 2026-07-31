import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.schema';
import type { DeadLetterQueries } from '../../core/ports/dead-letter-queries';
import type { DeadLetterReplayer } from '../../core/ports/dead-letter-replayer';
import type { DeadLetterRepository } from '../../core/ports/dead-letter.repository';
import { ListDeadLettersUseCase } from '../../core/use-cases/list-dead-letters.use-case';
import { ReplayDeadLetterUseCase } from '../../core/use-cases/replay-dead-letter.use-case';
import { createSqsClient } from '../../infrastructure/aws/sqs-client';
import { DatabaseService } from '../../infrastructure/database/database.service';
import { DrizzleDeadLetterQueries } from '../../infrastructure/persistence/drizzle-dead-letter-queries';
import { DrizzleDeadLetterRepository } from '../../infrastructure/persistence/drizzle-dead-letter.repository';
import { SqsDeadLetterReplayer } from '../../infrastructure/queues/sqs-dead-letter-replayer';
import {
  DEAD_LETTER_QUERIES,
  DEAD_LETTER_REPLAYER,
  DEAD_LETTER_REPOSITORY,
  LIST_DEAD_LETTERS_USE_CASE,
  REPLAY_DEAD_LETTER_USE_CASE,
} from '../../infrastructure/tokens';
import { DeadLettersController } from './dead-letters.controller';

function createDeadLetterReplayer(config: ConfigService<Env, true>): DeadLetterReplayer {
  const client = createSqsClient({
    AWS_REGION: config.get('AWS_REGION', { infer: true }),
    AWS_ENDPOINT_URL: config.get('AWS_ENDPOINT_URL', { infer: true }),
    AWS_ACCESS_KEY_ID: config.get('AWS_ACCESS_KEY_ID', { infer: true }),
    AWS_SECRET_ACCESS_KEY: config.get('AWS_SECRET_ACCESS_KEY', { infer: true }),
  });

  return new SqsDeadLetterReplayer(client, config.getOrThrow('ORDERS_QUEUE_URL', { infer: true }));
}

@Module({
  controllers: [DeadLettersController],
  providers: [
    {
      provide: DEAD_LETTER_QUERIES,
      inject: [DatabaseService],
      useFactory: (database: DatabaseService): DeadLetterQueries =>
        new DrizzleDeadLetterQueries(database.db),
    },
    {
      provide: DEAD_LETTER_REPOSITORY,
      inject: [DatabaseService],
      useFactory: (database: DatabaseService): DeadLetterRepository =>
        new DrizzleDeadLetterRepository(database.db),
    },
    {
      provide: DEAD_LETTER_REPLAYER,
      inject: [ConfigService],
      useFactory: createDeadLetterReplayer,
    },
    {
      provide: LIST_DEAD_LETTERS_USE_CASE,
      inject: [DEAD_LETTER_QUERIES],
      useFactory: (queries: DeadLetterQueries) => new ListDeadLettersUseCase(queries),
    },
    {
      provide: REPLAY_DEAD_LETTER_USE_CASE,
      inject: [DEAD_LETTER_QUERIES, DEAD_LETTER_REPOSITORY, DEAD_LETTER_REPLAYER],
      useFactory: (
        queries: DeadLetterQueries,
        deadLetters: DeadLetterRepository,
        replayer: DeadLetterReplayer,
      ) => new ReplayDeadLetterUseCase(queries, deadLetters, replayer),
    },
  ],
})
export class DeadLettersModule {}
