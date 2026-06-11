import CircuitBreaker from 'opossum';
import type { Logger } from 'pino';

export interface BreakerOptions {
  timeoutMs: number;
  errorThresholdPercentage: number;
  resetTimeoutMs: number;
  volumeThreshold: number;
}

export function createBreaker<TArgs extends unknown[], TReturn>(
  name: string,
  action: (...args: TArgs) => Promise<TReturn>,
  options: BreakerOptions,
  logger: Logger,
): CircuitBreaker<TArgs, TReturn> {
  const breaker = new CircuitBreaker(action, {
    name,
    timeout: options.timeoutMs,
    errorThresholdPercentage: options.errorThresholdPercentage,
    resetTimeout: options.resetTimeoutMs,
    volumeThreshold: options.volumeThreshold,
  });

  breaker.on('open', () => logger.warn({ breaker: name }, 'circuit breaker opened'));
  breaker.on('halfOpen', () => logger.info({ breaker: name }, 'circuit breaker half-open'));
  breaker.on('close', () => logger.info({ breaker: name }, 'circuit breaker closed'));

  return breaker;
}
