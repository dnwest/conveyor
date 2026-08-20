import http from 'k6/http';
import { check } from 'k6';
import { duration, number, url } from './lib/config.js';

// Read path: one iteration is a full dashboard refresh, the same six requests the
// console fires every 2.5s. The default rate of 20 refreshes/s stands in for
// roughly 50 consoles open at once.
//
// Each route carries its own latency budget: the ones that aggregate in Postgres
// or count a growing table get a looser one than the ones that read a single row
// or ask SQS for a queue depth.

const RATE = number('RATE', 20);
const DURATION = duration('DURATION', '60s');

const REFRESH = [
  { name: 'GET /metrics/summary', path: '/metrics/summary', budgetMs: 250 },
  {
    name: 'GET /metrics/throughput',
    path: '/metrics/throughput?windowMinutes=30&bucketMinutes=1',
    budgetMs: 250,
  },
  { name: 'GET /metrics/breaker', path: '/metrics/breaker', budgetMs: 100 },
  { name: 'GET /queues', path: '/queues', budgetMs: 100 },
  { name: 'GET /orders', path: '/orders?limit=10&offset=0', budgetMs: 250 },
  { name: 'GET /dead-letters', path: '/dead-letters?limit=10&offset=0', budgetMs: 100 },
];

const thresholds = { http_req_failed: ['rate<0.01'], checks: ['rate>0.99'] };
REFRESH.forEach((request) => {
  thresholds[`http_req_duration{name:${request.name}}`] = [`p(95)<${request.budgetMs}`];
});

export const options = {
  scenarios: {
    console: {
      executor: 'constant-arrival-rate',
      rate: RATE,
      timeUnit: '1s',
      duration: DURATION,
      preAllocatedVUs: 50,
      maxVUs: 300,
    },
  },
  thresholds,
};

export default function () {
  const responses = http.batch(
    REFRESH.map((request) => ({
      method: 'GET',
      url: url(request.path),
      params: { tags: { name: request.name } },
    })),
  );

  responses.forEach((response, index) => {
    check(response, { [`${REFRESH[index].name} is 200`]: (r) => r.status === 200 });
  });
}
