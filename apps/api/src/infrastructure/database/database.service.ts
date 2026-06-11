import { createDatabase, type Database, type DatabaseConnection } from '@conveyor/db';
import { Injectable, type OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.schema';

@Injectable()
export class DatabaseService implements OnApplicationShutdown {
  private readonly connection: DatabaseConnection;

  constructor(config: ConfigService<Env, true>) {
    this.connection = createDatabase(config.getOrThrow('DATABASE_URL', { infer: true }));
  }

  get db(): Database {
    return this.connection.db;
  }

  async onApplicationShutdown(): Promise<void> {
    await this.connection.close();
  }
}
