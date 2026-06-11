export default function Home() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Conveyor — Ops Console</h1>
        <p className="text-sm text-neutral-400">
          Real-time view of orders, throughput and queue health.
        </p>
      </header>
      <section className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-8 text-center text-sm text-neutral-500">
        Dashboard coming next — wiring up the API observability endpoints.
      </section>
    </main>
  );
}
