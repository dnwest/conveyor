'use client';

import { ORDER_STATUSES, type OrderStatus } from '@conveyor/core';
import { useMetricsSummary } from '@/lib/hooks';
import { ErrorState, SkeletonGrid } from './ui';

const STATUS_META: Record<OrderStatus, { label: string; dot: string }> = {
  pending: { label: 'Pending', dot: 'bg-amber-400' },
  processing: { label: 'Processing', dot: 'bg-sky-400' },
  completed: { label: 'Completed', dot: 'bg-emerald-400' },
  failed: { label: 'Failed', dot: 'bg-red-400' },
  dead_lettered: { label: 'Dead-lettered', dot: 'bg-fuchsia-400' },
};

function Card({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-5">
      <div className="text-xs uppercase tracking-wide text-neutral-500">{label}</div>
      <div className="mt-2 text-3xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

export function MetricsCards() {
  const { data, error, isLoading } = useMetricsSummary();

  if (error) return <ErrorState path="/metrics/summary" />;
  if (isLoading || !data) return <SkeletonGrid count={2} className="grid gap-4 sm:grid-cols-2" />;

  return (
    <section className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card label="Total orders" value={data.total} />
        <Card label="Processed · last hour" value={data.processedLastHour} />
      </div>
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {ORDER_STATUSES.map((status) => (
          <div key={status} className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-4">
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <span className={`h-2 w-2 rounded-full ${STATUS_META[status].dot}`} />
              {STATUS_META[status].label}
            </div>
            <div className="mt-2 text-2xl font-semibold tabular-nums">
              {data.statusCounts[status]}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
