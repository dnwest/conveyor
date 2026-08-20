'use client';

import type { BreakerState } from '@conveyor/core';
import { relativeTime } from '@/lib/format';
import { useBreakerState } from '@/lib/hooks';
import { ErrorState } from './ui';

const STATE_META: Record<BreakerState, { label: string; dot: string; border: string }> = {
  closed: { label: 'Closed', dot: 'bg-emerald-400', border: 'border-emerald-900/50' },
  half_open: { label: 'Half-open', dot: 'bg-amber-400', border: 'border-amber-900/50' },
  open: { label: 'Open', dot: 'bg-red-400', border: 'border-red-900/60' },
};

export function BreakerPanel() {
  const { data, error, isLoading } = useBreakerState();

  if (error) return <ErrorState path="/metrics/breaker" />;

  const breakers = data?.breakers ?? [];

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-medium">Circuit breaker</h2>

      {isLoading || !data ? (
        <div className="h-24 animate-pulse rounded-lg border border-neutral-800 bg-neutral-900/40" />
      ) : breakers.length === 0 ? (
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-5 text-sm text-neutral-500">
          No transitions recorded yet — the worker writes one every time a breaker opens, half-opens
          or closes.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {breakers.map((breaker) => {
            const meta = STATE_META[breaker.state];
            return (
              <div
                key={breaker.name}
                className={`rounded-lg border bg-neutral-900/40 p-5 ${meta.border}`}
              >
                <div className="font-mono text-sm text-neutral-300">{breaker.name}</div>
                <div className="mt-3 flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
                  <span className="text-2xl font-semibold">{meta.label}</span>
                </div>
                <div className="mt-1 text-xs text-neutral-500">
                  since {relativeTime(breaker.changedAt)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
