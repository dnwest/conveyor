import { fileURLToPath } from 'node:url';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required to run migrations');
}

const migrationsFolder = fileURLToPath(new URL('../drizzle', import.meta.url));
const client = postgres(connectionString, { max: 1 });

await migrate(drizzle(client), { migrationsFolder });
await client.end();

console.log('migrations applied');
