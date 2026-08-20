import http from 'k6/http';
import { check } from 'k6';
import { jsonParams, number, url } from './lib/config.js';
import { randomOrder } from './lib/orders.js';

// Write path only: how many orders the API can accept and publish per second
// before latency degrades. The worker drains the queue behind it — see pipeline.js
// for the end-to-end number.

const RATE = number('RATE', 120);

export const options = {
  scenarios: {
    ingest: {
      executor: 'ramping-arrival-rate',
      startRate: 10,
      timeUnit: '1s',
      preAllocatedVUs: 50,
      maxVUs: 300,
      stages: [
        { target: RATE, duration: '15s' },
        { target: RATE, duration: '45s' },
        { target: 0, duration: '5s' },
      ],
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<250'],
    checks: ['rate>0.99'],
  },
};

export default function () {
  const response = http.post(
    url('/orders'),
    JSON.stringify(randomOrder()),
    jsonParams('POST /orders'),
  );

  check(response, { 'order accepted (201)': (r) => r.status === 201 });
}
