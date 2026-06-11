# Conveyor

**Event-driven order processing platform** — a resilient SQS/SNS worker with Dead
Letter Queues and circuit breaking, fronted by a NestJS API and a real-time
Next.js operations console.

> Think of it as the conveyor belt of an order pipeline: messages move down the
> line, get processed, and the ones that fail drop into a DLQ you can inspect and
> replay — all observable from a live ops dashboard.

`NestJS` · `TypeScript` · `AWS SQS/SNS` · `Next.js` · `Turborepo` · `pnpm`

> **Status:** 🚧 In active development. This README is the design doc and roadmap;
> sections are checked off as they land.

---

## Why this exists

Most portfolio projects are either a backend with no face, or a dashboard with
fake data. Conveyor is deliberately **one cohesive full-stack product**: a
production-grade event-driven backend **and** the observability frontend that
operates it, sharing typed contracts. The goal is to demonstrate, end to end:

- Event-Driven Architecture done with real resilience patterns (not just a queue).
- Observability as a first-class concern — you can _see_ the system working.
- A monorepo that mirrors how a real product team would structure this.

## Architecture

```
┌────────────┐   publish   ┌───────────┐   consume   ┌────────────┐
│  api       │ ─────────▶ │  SNS/SQS  │ ─────────▶ │  worker    │
│  (NestJS)  │             │  + DLQ    │             │  processor │
└─────┬──────┘             └───────────┘             └─────┬──────┘
      │ REST + Swagger                                     │ metrics/events
      ▼                                                    ▼
┌──────────────────────────── Postgres ────────────────────────────┐
│  orders · processing log · dead letters · metrics                │
└──────────────────────────────────────────────────────────────────┘
      ▲
      │ REST (typed)
┌─────┴───────┐
│  web        │  Next.js ops console: live throughput, queue depth,
│  (dashboard)│  message status, DLQ inspection + replay, breaker state
└─────────────┘
```

### Monorepo layout (pnpm + Turborepo)

```
apps/
  api        NestJS — REST + Swagger; accepts orders, exposes metrics & DLQ ops
  worker     Resilient consumer — SQS/SNS, retries, backoff, DLQ, circuit breaker
  web        Next.js ops console — auth + real-time charts over the API
packages/
  core       Shared domain types & API contracts (single source of truth)
  config     Shared tsconfig / eslint / tailwind presets
```

## Engineering focus

These are the things the project is built to demonstrate well:

- **Resilience:** retries with exponential backoff, idempotent handlers, a Dead
  Letter Queue for poison messages, and a circuit breaker (Opossum) around
  downstream calls.
- **Observability:** structured logging (Pino), per-stage metrics, and a live
  dashboard so the system's health is visible, not guessed.
- **Correctness under load:** k6 load tests with documented results (throughput,
  p95, error rate) in the README — numbers, not adjectives.
- **Type-safe boundaries:** request/response and domain contracts shared via
  `packages/core`, so the API and the dashboard can't drift.
- **Real auth on the console:** the dashboard is gated by real authentication —
  no mock data, no fake login.

## Tech stack

| Layer         | Tech                                                                |
| ------------- | ------------------------------------------------------------------- |
| API           | NestJS, class-validator, Swagger/OpenAPI                            |
| Worker        | Node.js, AWS SDK v3 (SQS/SNS), Opossum (circuit breaker)            |
| Dashboard     | Next.js (App Router), Tailwind, Auth.js, a charting lib (TBD)       |
| Data          | Postgres                                                            |
| Validation    | Zod (config) + class-validator (API DTOs)                           |
| Observability | Pino structured logs, k6 load tests                                 |
| Tooling       | pnpm workspaces, Turborepo, Docker (multi-stage), GitHub Actions CI |

## Roadmap

- [x] Monorepo scaffold (pnpm + Turborepo, shared `core` package)
- [x] `worker`: SQS/SNS consumer with retries, backoff, DLQ
- [x] `worker`: circuit breaker + idempotency + structured logging
- [ ] `api`: NestJS REST + Swagger (submit orders, read status/metrics, DLQ ops)
- [x] Postgres schema + migrations (orders, processing log, dead letters, metrics)
- [ ] `web`: ops console — live throughput, queue depth, message status
- [ ] `web`: DLQ inspection + replay, circuit-breaker state
- [ ] `web`: real authentication (Auth.js)
- [ ] k6 load tests + documented results in this README
- [ ] CI (lint, test, build) + Docker images
- [ ] Deploy (Railway) with public Swagger + live dashboard demo

## Local development

```bash
pnpm install
pnpm dev          # runs api + worker + web via Turborepo
```

> Detailed setup (AWS/LocalStack, env vars, migrations) will be documented here as
> each app lands.

## License

MIT © Cristian Daniel Fernandes
