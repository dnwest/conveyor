'use client';

import { useState } from 'react';
import { ORDER_STATUSES, type OrderStatus } from '@conveyor/core';
import { useOrders } from '@/lib/hooks';
import { ErrorState } from './ui';

const PAGE_SIZE = 10;

const money = (cents: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);

const STATUS_BADGE: Record<OrderStatus, string> = {
  pending: 'bg-amber-400/10 text-amber-300',
  processing: 'bg-sky-400/10 text-sky-300',
  completed: 'bg-emerald-400/10 text-emerald-300',
  failed: 'bg-red-400/10 text-red-300',
  dead_lettered: 'bg-fuchsia-400/10 text-fuchsia-300',
};

export function OrdersTable() {
  const [offset, setOffset] = useState(0);
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const { data, error } = useOrders(PAGE_SIZE, offset, status || undefined);

  if (error) return <ErrorState path="/orders" />;

  const total = data?.total ?? 0;
  const items = data?.items ?? [];

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Orders</h2>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as OrderStatus | '');
            setOffset(0);
          }}
          className="rounded-md border border-neutral-800 bg-neutral-900 px-2 py-1 text-sm"
        >
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-neutral-800">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-2 font-medium">Order</th>
              <th className="px-4 py-2 font-medium">Customer</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Total</th>
              <th className="px-4 py-2 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {items.map((order) => (
              <tr key={order.id} className="border-t border-neutral-800/70">
                <td className="px-4 py-2 font-mono text-xs text-neutral-400">
                  {order.id.slice(0, 8)}
                </td>
                <td className="px-4 py-2">{order.customerId}</td>
                <td className="px-4 py-2">
                  <span className={`rounded px-2 py-0.5 text-xs ${STATUS_BADGE[order.status]}`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-4 py-2 tabular-nums">{money(order.totalCents)}</td>
                <td className="px-4 py-2 text-neutral-400">
                  {new Date(order.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-neutral-500">
                  No orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-neutral-400">
        <span>{total} total</span>
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
