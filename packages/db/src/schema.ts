import { ORDER_STATUSES, type OrderItem } from '@conveyor/core';
import {
  doublePrecision,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export const orderStatus = pgEnum('order_status', ORDER_STATUSES);

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey(),
  customerId: text('customer_id').notNull(),
  items: jsonb('items').$type<OrderItem[]>().notNull(),
  status: orderStatus('status').notNull(),
  totalCents: integer('total_cents').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

export const processingLog = pgTable('processing_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull(),
  status: text('status').notNull(),
  attempt: integer('attempt').notNull().default(1),
  error: text('error'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const deadLetters = pgTable('dead_letters', {
  id: uuid('id').primaryKey().defaultRandom(),
  messageId: text('message_id').notNull(),
  orderId: uuid('order_id'),
  payload: text('payload').notNull(),
  error: text('error'),
  receiveCount: integer('receive_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  replayedAt: timestamp('replayed_at', { withTimezone: true }),
});

export const metrics = pgTable('metrics', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  labels: jsonb('labels'),
  value: doublePrecision('value').notNull(),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull().defaultNow(),
});
