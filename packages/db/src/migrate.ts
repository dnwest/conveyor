import { runMigrations } from './migrator';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required to run migrations');
}

await runMigrations(connectionString);

console.log('migrations applied');
