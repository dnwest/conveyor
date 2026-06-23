'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useThroughput } from '@/lib/hooks';
import { ErrorState } from './ui';

const WINDOW_MINUTES = 30;
const BUCKET_MINUTES = 1;

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export function ThroughputChart() {
  const { data, error, isLoading } = useThroughput(WINDOW_MINUTES, BUCKET_MINUTES);

  if (error) return <ErrorState path="/metrics/throughput" />;

  const points = data?.points ?? [];
  const total = points.reduce((sum, point) => sum + point.completed, 0);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-medium">Throughput</h2>
        <span className="text-sm text-neutral-400">
          {total} completed · last {WINDOW_MINUTES} min
        </span>
      </div>

      <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-4">
        {isLoading || !data ? (
          <div className="h-56 animate-pulse rounded-md bg-neutral-900/60" />
        ) : (
          <ResponsiveContainer width="100%" height={224}>
            <AreaChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <defs>
                <linearGradient id="throughputFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
              <XAxis
                dataKey="bucket"
                tickFormatter={formatTime}
                stroke="#525252"
                fontSize={12}
                tickLine={false}
                minTickGap={32}
              />
              <YAxis
                stroke="#525252"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                width={32}
              />
              <Tooltip
                cursor={{ stroke: '#404040' }}
                labelFormatter={(iso: string) => formatTime(iso)}
                formatter={(value: number) => [value, 'completed']}
                contentStyle={{
                  background: '#0a0a0a',
                  border: '1px solid #262626',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: '#a3a3a3' }}
              />
              <Area
                type="monotone"
                dataKey="completed"
                stroke="#34d399"
                strokeWidth={2}
                fill="url(#throughputFill)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
