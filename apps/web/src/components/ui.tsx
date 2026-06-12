export function ErrorState({ path }: { path: string }) {
  return (
    <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-300">
      Couldn&apos;t load <code className="font-mono">{path}</code> — is the API running on :3000?
    </div>
  );
}

export function SkeletonGrid({ count, className = '' }: { count: number; className?: string }) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-24 animate-pulse rounded-lg border border-neutral-800 bg-neutral-900/40"
        />
      ))}
    </div>
  );
}
