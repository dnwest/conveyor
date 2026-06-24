import CircuitBreaker from 'opossum';
import type { Logger } from 'pino';
import type { BreakerState } from './breaker-state-store';

export interface BreakerOptions {
  timeoutMs: number;
  errorThresholdPercentage: number;
  resetTimeoutMs: number;
  volumeThreshold: number;
}

export type OnBreakerState = (state: BreakerState) => void;

export function createBreaker<TArgs extends unknown[], TReturn>(
  name: string,
  action: (...args: TArgs) => Promise<TReturn>,
  options: BreakerOptions,
  logger: Logger,
  onStateChange?: OnBreakerState,
): CircuitBreaker<TArgs, TReturn> {
  const breaker = new CircuitBreaker(action, {
    name,
    timeout: options.timeoutMs,
    errorThresholdPercentage: options.errorThresholdPercentage,
    resetTimeout: options.resetTimeoutMs,
    volumeThreshold: options.volumeThreshold,
  });

  breaker.on('open', () => {
    logger.warn({ breaker: name }, 'circuit breaker opened');
    onStateChange?.('open');
  });
  breaker.on('halfOpen', () => {
    logger.info({ breaker: name }, 'circuit breaker half-open');
    onStateChange?.('half_open');
  });
  breaker.on('close', () => {
    logger.info({ breaker: name }, 'circuit breaker closed');
    onStateChange?.('closed');
  });

  return breaker;
}
