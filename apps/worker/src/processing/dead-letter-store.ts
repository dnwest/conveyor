export interface DeadLetterRecord {
  messageId: string;
  orderId: string | null;
  payload: string;
  error: string | null;
  receiveCount: number;
}

export interface DeadLetterStore {
  // Persists a dead letter (deduped by messageId) and marks the related order
  // as dead-lettered, so poison messages can be inspected and replayed.
  save(record: DeadLetterRecord): Promise<void>;
}
