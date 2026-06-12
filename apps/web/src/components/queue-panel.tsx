'use client';

import { useQueueDepths } from '@/lib/hooks';
import { ErrorState } from './ui';

function QueueCard({
  title,
  available,
  inFlight,
  danger,
}: {
  title: string;
  available?: number;
  inFlight?: number;
  danger?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border bg-neutral-900/40 p-5 ${
        danger ? 'border-fuchsia-900/50' : 'border-neutral-800'
      }`}
    >
      <div className="text-sm font-medium text-neutral-200">{title}</div>
      <div className="mt-3 flex gap-8">
        <div>
          <div className="text-2xl font-semibold tabular-nums">{available ?? '—'}</div>
          <div className="text-xs text-neutral-500">available</div>
        </div>
        <div>
          <div className="text-2xl font-semibold tabular-nums">{inFlight ?? '—'}</div>
          <div className="text-xs text-neutral-500">in flight</div>
        </div>
      </div>
    </div>
  );
}

export function QueuePanel() {
  const { data, error } = useQueueDepths();

  if (error) return <ErrorState path="/queues" />;

  return (
    <section className="grid gap-4 sm:grid-cols-2">
      <QueueCard
        title="Orders queue"
        available={data?.queue.available}
        inFlight={data?.queue.inFlight}
      />
      <QueueCard
        title="Dead-letter queue"
        available={data?.deadLetter.available}
        inFlight={data?.deadLetter.inFlight}
        danger
      />
    </section>
  );
}
