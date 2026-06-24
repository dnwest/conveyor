export interface ProcessingLog {
  // Records a terminal processing failure for an order (after retries are
  // exhausted), so the failure can be surfaced in observability.
  recordFailure(orderId: string, attempt: number, error: string): Promise<void>;
}
