import { processingLog, type Database } from '@conveyor/db';
import type { ProcessingLog } from '../processing/processing-log';

export class DrizzleProcessingLog implements ProcessingLog {
  constructor(private readonly db: Database) {}

  async recordFailure(orderId: string, attempt: number, error: string): Promise<void> {
    await this.db.insert(processingLog).values({ orderId, status: 'failed', attempt, error });
  }
}
