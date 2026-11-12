import { fileURLToPath } from 'node:url';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

// Resolves to the package's own drizzle/ folder from both src/ and dist/, so the
// SQL files travel with @conveyor/db into any image that depends on it.
const migrationsFolder = fileURLToPath(new URL('../drizzle', import.meta.url));

export async function runMigrations(connectionString: string): Promise<void> {
  const client = postgres(connectionString, { max: 1, onnotice: () => {} });
  try {
    await migrate(drizzle(client), { migrationsFolder });
  } finally {
    await client.end();
  }
}
