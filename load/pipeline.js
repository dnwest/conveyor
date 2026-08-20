import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { duration, jsonParams, number, url } from './lib/config.js';
import { randomOrder } from './lib/orders.js';

// End-to-end: submit an order and poll it until the worker marks it completed, so
// the reported latency covers API + SNS + SQS + worker + Postgres, not just the
// HTTP hop.

const RATE = number('RATE', 20);
const DURATION = duration('DURATION', '60s');
// Polling backs off so a fast order is timed sharply without a slow one turning
// the measurement into its own load: the reported latency carries at most one
// poll interval of error.
const POLL_INTERVAL_MS = number('POLL_INTERVAL_MS', 50);
const POLL_MAX_INTERVAL_MS = number('POLL_MAX_INTERVAL_MS', 250);
const POLL_TIMEOUT_MS = number('POLL_TIMEOUT_MS', 30000);

const endToEnd = new Trend('order_end_to_end', true);
const completed = new Rate('order_completed');

export const options = {
  scenarios: {
    pipeline: {
      executor: 'constant-arrival-rate',
      rate: RATE,
      timeUnit: '1s',
      duration: DURATION,
      preAllocatedVUs: 50,
      maxVUs: 300,
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    order_completed: ['rate>0.99'],
    order_end_to_end: ['p(95)<1000'],
  },
};

export default function () {
  const submittedAt = Date.now();
  const submission = http.post(
    url('/orders'),
    JSON.stringify(randomOrder()),
    jsonParams('POST /orders'),
  );

  if (!check(submission, { 'order accepted (201)': (r) => r.status === 201 })) {
    completed.add(false);
    return;
  }

  const orderId = submission.json('id');
  const pollParams = { tags: { name: 'GET /orders/:id' } };
  let interval = POLL_INTERVAL_MS;

  while (Date.now() - submittedAt < POLL_TIMEOUT_MS) {
    sleep(interval / 1000);
    interval = Math.min(interval * 1.5, POLL_MAX_INTERVAL_MS);

    const poll = http.get(url(`/orders/${orderId}`), pollParams);
    const status = poll.status === 200 ? poll.json('status') : null;

    if (status === 'completed') {
      endToEnd.add(Date.now() - submittedAt);
      completed.add(true);
      return;
    }

    if (status === 'dead_lettered') {
      break;
    }
  }

  completed.add(false);
}
