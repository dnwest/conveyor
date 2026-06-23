import {
  ORDER_STATUSES,
  type MetricsSummary,
  type Order,
  type OrderStatus,
  type ThroughputSeries,
} from '@conveyor/core';
import { orders, processingLog, type Database } from '@conveyor/db';
import { and, desc, eq, gt, sql } from 'drizzle-orm';
import type {
  ListOrdersParams,
  OrderQueries,
  ThroughputParams,
} from '../../core/ports/order-queries';
import { toOrderDomain } from './order.mapper';

export class DrizzleOrderQueries implements OrderQueries {
  constructor(private readonly db: Database) {}

  async list(params: ListOrdersParams): Promise<{ items: Order[]; total: number }> {
    const where = params.status ? eq(orders.status, params.status) : undefined;

    const rows = await this.db
      .select()
      .from(orders)
      .where(where)
      .orderBy(desc(orders.createdAt))
      .limit(params.limit)
      .offset(params.offset);

    const [counted] = await this.db
      .select({ total: sql<number>`count(*)::int` })
      .from(orders)
      .where(where);

    return { items: rows.map(toOrderDomain), total: counted?.total ?? 0 };
  }

  async summary(): Promise<MetricsSummary> {
    const grouped = await this.db
      .select({ status: orders.status, count: sql<number>`count(*)::int` })
      .from(orders)
      .groupBy(orders.status);

    const statusCounts = Object.fromEntries(ORDER_STATUSES.map((status) => [status, 0])) as Record<
      OrderStatus,
      number
    >;
    let total = 0;
    for (const row of grouped) {
      statusCounts[row.status] = row.count;
      total += row.count;
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const [processed] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(processingLog)
      .where(and(eq(processingLog.status, 'succeeded'), gt(processingLog.createdAt, oneHourAgo)));

    return { total, statusCounts, processedLastHour: processed?.count ?? 0 };
  }

  async throughput({ windowMinutes, bucketMinutes }: ThroughputParams): Promise<ThroughputSeries> {
    const bucketMs = bucketMinutes * 60_000;
    const since = new Date(Math.floor(Date.now() / bucketMs) * bucketMs - windowMinutes * 60_000);
    const origin = sql`${since.toISOString()}::timestamptz`;
    const stride = sql`make_interval(mins => ${bucketMinutes})`;

    const rows = await this.db
      .select({
        bucket: sql<string>`date_bin(${stride}, ${processingLog.createdAt}, ${origin})`.as(
          'bucket',
        ),
        completed: sql<number>`count(*)::int`,
      })
      .from(processingLog)
      .where(and(eq(processingLog.status, 'succeeded'), gt(processingLog.createdAt, origin)))
      .groupBy(sql`bucket`);

    const counts = new Map(rows.map((row) => [new Date(row.bucket).getTime(), row.completed]));
    const points: ThroughputSeries['points'] = [];
    for (let t = since.getTime(); t <= Date.now(); t += bucketMs) {
      points.push({ bucket: new Date(t).toISOString(), completed: counts.get(t) ?? 0 });
    }

    return { windowMinutes, bucketMinutes, points };
  }
}
