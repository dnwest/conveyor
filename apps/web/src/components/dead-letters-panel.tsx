'use client';

import { Fragment, useState } from 'react';
import { ApiError } from '@/lib/api';
import { relativeTime } from '@/lib/format';
import { useDeadLetters } from '@/lib/hooks';
import { replayDeadLetter } from '@/lib/mutations';
import { ErrorState } from './ui';

const PAGE_SIZE = 10;

const REPLAY_FAILURES: Record<number, string> = {
  401: 'Your session expired — sign in again.',
  403: 'Replaying requires an operator account.',
  404: 'This dead letter no longer exists.',
  409: 'Already replayed — the list was out of date.',
  422: 'Payload is not a replayable order event.',
};

function replayFailure(error: unknown): string {
  if (error instanceof ApiError) {
    return REPLAY_FAILURES[error.status] ?? error.message;
  }
  return 'Replay failed — is the API running on :3000?';
}

function prettyPayload(payload: string): string {
  try {
    return JSON.stringify(JSON.parse(payload), null, 2);
  } catch {
    return payload;
  }
}

function Chevron({ expanded }: { expanded: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className={`h-3 w-3 text-neutral-600 transition-transform ${expanded ? 'rotate-90' : ''}`}
    >
      <path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function DeadLettersPanel({ canReplay }: { canReplay: boolean }) {
  const [offset, setOffset] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replayingId, setReplayingId] = useState<string | null>(null);
  const [failure, setFailure] = useState<{ id: string; message: string } | null>(null);
  const { data, error, mutate } = useDeadLetters(PAGE_SIZE, offset);

  if (error) return <ErrorState path="/dead-letters" />;

  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  async function replay(id: string) {
    setReplayingId(id);
    setFailure(null);
    try {
      await replayDeadLetter(id);
      await mutate();
    } catch (caught) {
      setFailure({ id, message: replayFailure(caught) });
    } finally {
      setReplayingId(null);
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-medium">Dead letters</h2>
        <span className="text-sm text-neutral-400">{total} captured</span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-neutral-800">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-2 font-medium">Message</th>
              <th className="px-4 py-2 font-medium">Order</th>
              <th className="px-4 py-2 font-medium">Receives</th>
              <th className="px-4 py-2 font-medium">Captured</th>
              <th className="px-4 py-2 font-medium">State</th>
              <th className="px-4 py-2 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((deadLetter) => {
              const expanded = expandedId === deadLetter.id;
              const replaying = replayingId === deadLetter.id;
              return (
                <Fragment key={deadLetter.id}>
                  <tr className="border-t border-neutral-800/70">
                    <td className="px-4 py-2">
                      <button
                        type="button"
                        onClick={() => setExpandedId(expanded ? null : deadLetter.id)}
                        aria-expanded={expanded}
                        className="flex items-center gap-2 font-mono text-xs text-neutral-400 hover:text-neutral-200"
                      >
                        <Chevron expanded={expanded} />
                        {deadLetter.messageId.slice(0, 8)}
                      </button>
                    </td>
                    <td className="px-4 py-2 font-mono text-xs text-neutral-400">
                      {deadLetter.orderId ? deadLetter.orderId.slice(0, 8) : '—'}
                    </td>
                    <td className="px-4 py-2 tabular-nums">{deadLetter.receiveCount}</td>
                    <td className="px-4 py-2 text-neutral-400">
                      {relativeTime(deadLetter.createdAt)}
                    </td>
                    <td className="px-4 py-2">
                      {deadLetter.replayedAt ? (
                        <span className="rounded bg-emerald-400/10 px-2 py-0.5 text-xs text-emerald-300">
                          replayed
                        </span>
                      ) : (
                        <span className="rounded bg-fuchsia-400/10 px-2 py-0.5 text-xs text-fuchsia-300">
                          pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        type="button"
                        disabled={!canReplay || Boolean(deadLetter.replayedAt) || replaying}
                        onClick={() => void replay(deadLetter.id)}
                        title={canReplay ? undefined : 'Replaying requires an operator account'}
                        className="rounded-md border border-neutral-700 px-3 py-1 text-xs hover:border-neutral-500 disabled:opacity-40 disabled:hover:border-neutral-700"
                      >
                        {replaying ? 'Replaying…' : 'Replay'}
                      </button>
                    </td>
                  </tr>

                  {failure?.id === deadLetter.id && (
                    <tr className="border-t border-neutral-800/70">
                      <td colSpan={6} className="px-4 py-2 text-xs text-red-300">
                        {failure.message}
                      </td>
                    </tr>
                  )}

                  {expanded && (
                    <tr className="border-t border-neutral-800/70 bg-neutral-900/40">
                      <td colSpan={6} className="px-4 py-3">
                        <dl className="flex flex-col gap-3">
                          <div>
                            <dt className="text-xs uppercase tracking-wide text-neutral-500">
                              Failure
                            </dt>
                            <dd className="mt-1 text-xs text-red-300">
                              {deadLetter.error ?? 'not recorded'}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs uppercase tracking-wide text-neutral-500">
                              Payload
                            </dt>
                            <dd>
                              <pre className="mt-1 max-h-64 overflow-auto rounded-md border border-neutral-800 bg-neutral-950 p-3 font-mono text-xs text-neutral-300">
                                {prettyPayload(deadLetter.payload)}
                              </pre>
                            </dd>
                          </div>
                        </dl>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                  No dead letters — nothing has exhausted its retries.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-neutral-400">
        <span>
          {canReplay
            ? 'Replaying sends the stored payload back to the orders queue.'
            : 'Replaying a dead letter requires an operator account.'}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
            className="rounded-md border border-neutral-800 px-3 py-1 disabled:opacity-40"
          >
            Prev
          </button>
          <button
            type="button"
            disabled={offset + PAGE_SIZE >= total}
            onClick={() => setOffset(offset + PAGE_SIZE)}
            className="rounded-md border border-neutral-800 px-3 py-1 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
