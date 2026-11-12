import { runMigrations } from '@conveyor/db';
import pino from 'pino';
import { z } from 'zod';

const logger = pino({ name: 'migrate' });

async function main(): Promise<void> {
  const { DATABASE_URL } = z.object({ DATABASE_URL: z.string().url() }).parse(process.env);

  const startedAt = Date.now();
  await runMigrations(DATABASE_URL);
  logger.info({ durationMs: Date.now() - startedAt }, 'migrations applied');
}

main().catch((error: unknown) => {
  logger.fatal({ err: error }, 'migrations failed');
  process.exit(1);
});
