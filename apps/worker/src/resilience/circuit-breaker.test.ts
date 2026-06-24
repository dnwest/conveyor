import { pino } from 'pino';
import { describe, expect, it, vi } from 'vitest';
import { createBreaker } from './circuit-breaker';

const silentLogger = pino({ level: 'silent' });

const options = {
  timeoutMs: 100,
  errorThresholdPercentage: 50,
  resetTimeoutMs: 10_000,
  volumeThreshold: 1,
};

describe('createBreaker', () => {
  it('passes through the action result while closed', async () => {
    const breaker = createBreaker('ok', async (n: number) => n * 2, options, silentLogger);

    await expect(breaker.fire(21)).resolves.toBe(42);
    expect(breaker.opened).toBe(false);
  });

  it('opens and fast-fails after the failure threshold is exceeded', async () => {
    const breaker = createBreaker(
      'failing',
      async () => {
        throw new Error('downstream down');
      },
      options,
      silentLogger,
    );

    for (let i = 0; i < 3; i += 1) {
      await expect(breaker.fire()).rejects.toBeDefined();
    }

    expect(breaker.opened).toBe(true);
    await expect(breaker.fire()).rejects.toThrow(/breaker is open|Breaker is open/i);
  });

  it('reports the open transition through the state callback', async () => {
    const onState = vi.fn();
    const breaker = createBreaker(
      'failing',
      async () => {
        throw new Error('downstream down');
      },
      options,
      silentLogger,
      onState,
    );

    for (let i = 0; i < 3; i += 1) {
      await expect(breaker.fire()).rejects.toBeDefined();
    }

    expect(breaker.opened).toBe(true);
    expect(onState).toHaveBeenCalledWith('open');
  });
});
