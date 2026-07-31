import {
  ORDER_STATUSES,
  type MetricsSummary,
  type Order,
  type OrderStatus,
  type ThroughputSeries,
} from '@conveyor/core';
import { orders, processingLog, type Database } from '@conveyor/db';
import { and, desc, eq, gt, inArray, sql } from 'drizzle-orm';
import type {
  ListOrdersParams,
  OrderQueries,
  ThroughputParams,
} from '../../core/ports/order-queries';
import { toOrderDomain } from './order.mapper';

const SUCCEEDED = 'succeeded';
const FAILED = 'failed';

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
      .where(and(eq(processingLog.status, SUCCEEDED), gt(processingLog.createdAt, oneHourAgo)));

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
        status: processingLog.status,
        count: sql<number>`count(*)::int`,
      })
      .from(processingLog)
      .where(
        and(
          inArray(processingLog.status, [SUCCEEDED, FAILED]),
          gt(processingLog.createdAt, origin),
        ),
      )
      .groupBy(sql`bucket`, processingLog.status);

    const completedCounts = new Map<number, number>();
    const failedCounts = new Map<number, number>();
    for (const row of rows) {
      const counts = row.status === SUCCEEDED ? completedCounts : failedCounts;
      counts.set(new Date(row.bucket).getTime(), row.count);
    }

    const points: ThroughputSeries['points'] = [];
    for (let t = since.getTime(); t <= Date.now(); t += bucketMs) {
      points.push({
        bucket: new Date(t).toISOString(),
        completed: completedCounts.get(t) ?? 0,
        failed: failedCounts.get(t) ?? 0,
      });
    }

    return { windowMinutes, bucketMinutes, points };
  }
}
