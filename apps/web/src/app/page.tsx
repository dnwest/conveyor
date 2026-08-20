import { auth } from '@/auth';
import { BreakerPanel } from '@/components/breaker-panel';
import { DeadLettersPanel } from '@/components/dead-letters-panel';
import { MetricsCards } from '@/components/metrics-cards';
import { OrdersTable } from '@/components/orders-table';
import { QueuePanel } from '@/components/queue-panel';
import { SessionBar } from '@/components/session-bar';
import { ThroughputChart } from '@/components/throughput-chart';

export default async function Home() {
  const session = await auth();

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Conveyor — Ops Console</h1>
          <p className="text-sm text-neutral-400">
            Live view of orders, throughput and queue health · refreshes every couple of seconds.
          </p>
        </div>
        <SessionBar />
      </header>
      <MetricsCards />
      <ThroughputChart />
      <QueuePanel />
      <BreakerPanel />
      <DeadLettersPanel canReplay={session?.user.role === 'operator'} />
      <OrdersTable />
    </main>
  );
}
