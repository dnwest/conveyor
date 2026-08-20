import useSWR from 'swr';
import {
  breakerStatusListSchema,
  deadLetterListResponseSchema,
  metricsSummarySchema,
  orderListResponseSchema,
  queueDepthsSchema,
  throughputSeriesSchema,
  type OrderStatus,
} from '@conveyor/core';
import { apiFetch } from './api';

const REFRESH_MS = 2500;

export function useMetricsSummary() {
  return useSWR('/metrics/summary', (path) => apiFetch(path, metricsSummarySchema), {
    refreshInterval: REFRESH_MS,
  });
}

export function useThroughput(windowMinutes: number, bucketMinutes: number) {
  const params = new URLSearchParams({
    windowMinutes: String(windowMinutes),
    bucketMinutes: String(bucketMinutes),
  });
  const path = `/metrics/throughput?${params.toString()}`;
  return useSWR(path, (p) => apiFetch(p, throughputSeriesSchema), { refreshInterval: REFRESH_MS });
}

export function useBreakerState() {
  return useSWR('/metrics/breaker', (path) => apiFetch(path, breakerStatusListSchema), {
    refreshInterval: REFRESH_MS,
  });
}

export function useQueueDepths() {
  return useSWR('/queues', (path) => apiFetch(path, queueDepthsSchema), {
    refreshInterval: REFRESH_MS,
  });
}

export function useOrders(limit: number, offset: number, status?: OrderStatus) {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  if (status) params.set('status', status);
  const path = `/orders?${params.toString()}`;
  return useSWR(path, (p) => apiFetch(p, orderListResponseSchema), { refreshInterval: REFRESH_MS });
}

export function useDeadLetters(limit: number, offset: number) {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  const path = `/dead-letters?${params.toString()}`;
  return useSWR(path, (p) => apiFetch(p, deadLetterListResponseSchema), {
    refreshInterval: REFRESH_MS,
  });
}
