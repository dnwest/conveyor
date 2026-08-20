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

const SERIES = [
  { key: 'completed', color: '#34d399', dot: 'bg-emerald-400' },
  { key: 'failed', color: '#f87171', dot: 'bg-red-400' },
] as const;

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export function ThroughputChart() {
  const { data, error, isLoading } = useThroughput(WINDOW_MINUTES, BUCKET_MINUTES);

  if (error) return <ErrorState path="/metrics/throughput" />;

  const points = data?.points ?? [];
  const totals = {
    completed: points.reduce((sum, point) => sum + point.completed, 0),
    failed: points.reduce((sum, point) => sum + point.failed, 0),
  };

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-medium">Throughput</h2>
        <div className="flex items-center gap-4 text-sm text-neutral-400">
          {SERIES.map((series) => (
            <span key={series.key} className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${series.dot}`} />
              <span className="tabular-nums">{totals[series.key]}</span> {series.key}
            </span>
          ))}
          <span>· last {WINDOW_MINUTES} min</span>
        </div>
      </div>

      <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-4">
        {isLoading || !data ? (
          <div className="h-56 animate-pulse rounded-md bg-neutral-900/60" />
        ) : (
          <ResponsiveContainer width="100%" height={224}>
            <AreaChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <defs>
                {SERIES.map((series) => (
                  <linearGradient
                    key={series.key}
                    id={`${series.key}Fill`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor={series.color} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={series.color} stopOpacity={0} />
                  </linearGradient>
                ))}
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
                contentStyle={{
                  background: '#0a0a0a',
                  border: '1px solid #262626',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: '#a3a3a3' }}
              />
              {SERIES.map((series) => (
                <Area
                  key={series.key}
                  type="monotone"
                  dataKey={series.key}
                  stroke={series.color}
                  strokeWidth={2}
                  fill={`url(#${series.key}Fill)`}
                  isAnimationActive={false}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
