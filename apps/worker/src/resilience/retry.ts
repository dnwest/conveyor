export interface RetryOptions {
  retries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

export type OnRetry = (attempt: number, error: unknown, delayMs: number) => void;

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions,
  onRetry?: OnRetry,
): Promise<T> {
  let attempt = 0;

  for (;;) {
    try {
      return await operation();
    } catch (error) {
      attempt += 1;
      if (attempt > options.retries) {
        throw error;
      }

      const exponential = options.baseDelayMs * 2 ** (attempt - 1);
      const capped = Math.min(exponential, options.maxDelayMs);
      const delayMs = Math.round(capped + Math.random() * capped * 0.2);

      onRetry?.(attempt, error, delayMs);
      await sleep(delayMs);
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
