import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export type Database = PostgresJsDatabase<typeof schema>;

export interface DatabaseConnection {
  db: Database;
  close: () => Promise<void>;
}

export function createDatabase(connectionString: string): DatabaseConnection {
  const client = postgres(connectionString);
  const db = drizzle(client, { schema });

  return {
    db,
    close: () => client.end(),
  };
}
