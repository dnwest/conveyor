import { MetricsCards } from '@/components/metrics-cards';
import { OrdersTable } from '@/components/orders-table';
import { QueuePanel } from '@/components/queue-panel';

export default function Home() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Conveyor — Ops Console</h1>
        <p className="text-sm text-neutral-400">
          Live view of orders, throughput and queue health · refreshes every couple of seconds.
        </p>
      </header>
      <MetricsCards />
      <QueuePanel />
      <OrdersTable />
    </main>
  );
}
