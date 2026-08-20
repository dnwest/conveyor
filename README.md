<div align="center">

# Conveyor

**Event-driven order processing platform** — a resilient SQS/SNS worker with Dead
Letter Queues and circuit breaking, fronted by a NestJS API and a real-time
Next.js operations console.

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![AWS SQS/SNS](https://img.shields.io/badge/AWS-SQS%2FSNS-FF9900?logo=amazonaws&logoColor=white)](https://aws.amazon.com/sqs/)
[![Turborepo](https://img.shields.io/badge/Turborepo-EF4444?logo=turborepo&logoColor=white)](https://turbo.build/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](#license)

</div>

> Think of it as the conveyor belt of an order pipeline: messages move down the
> line, get processed, and the ones that fail drop into a DLQ you can inspect and
> replay — all observable from a live ops dashboard.

> **Status:** 🚧 In active development. This README doubles as the design doc and
> roadmap; sections are checked off as they land. No fake data, no mock screens —
> features show up here only once they actually work.

---

## Table of contents

- [Why this exists](#why-this-exists)
- [Architecture](#architecture)
- [API surface](#api-surface)
- [Access control](#access-control)
- [Engineering focus](#engineering-focus)
- [Design decisions](#design-decisions)
- [Tech stack](#tech-stack)
- [Project layout](#project-layout)
- [Getting started](#getting-started)
- [Roadmap](#roadmap)
- [License](#license)

## Why this exists

Most portfolio projects are either a backend with no face, or a dashboard with
fake data. Conveyor is deliberately **one cohesive full-stack product**: a
production-grade event-driven backend **and** the observability frontend that
operates it, sharing typed contracts. The goal is to demonstrate, end to end:

- **Event-Driven Architecture** done with real resilience patterns — not just a queue.
- **Observability as a first-class concern** — you can _see_ the system working.
- **A monorepo** that mirrors how a real product team would structure this.

Two of the patterns Conveyor leans on get an isolated, deep-dive treatment in their
own focused repositories — synchronous reliability and infrastructure-as-code in
[resilient-node-microservice](https://github.com/dnwest/resilient-node-microservice),
and asynchronous messaging in
[event-driven-order-processor](https://github.com/dnwest/event-driven-order-processor).
Conveyor composes both into a single full-stack product.

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

**The flow:** the API validates and persists an order, then publishes an event.
The worker consumes it with retries and exponential backoff; a circuit breaker
guards the downstream call, and poison messages land in a Dead Letter Queue.
Every stage writes to Postgres, and the web console reads it all back over the
typed REST API — so the system's health is visible, not guessed.

## API surface

Interactive docs are served by Swagger at **`/docs`** when the API is running.

| Method | Path                       | Description                                                |
| ------ | -------------------------- | ---------------------------------------------------------- |
| `POST` | `/orders`                  | Submit an order for processing                             |
| `GET`  | `/orders`                  | List orders, most recent first (paginated + status filter) |
| `GET`  | `/orders/:id`              | Fetch a single order by id                                 |
| `GET`  | `/metrics/summary`         | Order counts by status + last-hour throughput              |
| `GET`  | `/metrics/throughput`      | Completed and failed orders bucketed over a time window    |
| `GET`  | `/metrics/breaker`         | Current circuit-breaker state, as recorded by the worker   |
| `GET`  | `/queues`                  | Approximate depth of the main queue and its DLQ            |
| `GET`  | `/dead-letters`            | Inspect dead letters, most recent first (paginated)        |
| `POST` | `/dead-letters/:id/replay` | Send one dead letter back to the orders queue (authorised) |
| `GET`  | `/docs`                    | Swagger / OpenAPI UI                                       |

Replay is a redrive of a single message rather than a new domain event: the
stored payload goes straight back to the orders queue. It is idempotent — a
repeated or concurrent replay gets `409`, and a payload that no longer parses
gets `422` instead of being put back on the queue. It is also the one endpoint
that is not open: it requires a service token, which only the console's own
server holds (see [Access control](#access-control)).

## Access control

The console requires a session on every route. There are two ways in:

| Sign-in                              | Role       | May replay dead letters |
| ------------------------------------ | ---------- | ----------------------- |
| GitHub OAuth, email on the allowlist | `operator` | yes                     |
| Demo account (email + password)      | `viewer`   | no                      |

The demo account exists so the hosted deploy can be explored without handing out
the ability to move messages around. The GitHub provider registers itself only
when its credentials are configured, so a checkout with no OAuth app still boots
and offers demo sign-in alone.

Authorisation is enforced on the server, not just in the UI. The browser never
holds the service token: a replay goes to the console's own route handler, which
checks the session and the role before forwarding it to the API, and the API
rejects the call outright without that token. Read endpoints stay open on
purpose — the hosted Swagger is meant to be explored.

Passwords are verified with `scrypt` from `node:crypto`; the demo hash is
generated with `pnpm --filter @conveyor/web hash-password` and lives in the
environment, never in the repository.

## Engineering focus

These are the things the project is built to demonstrate well:

- **Resilience:** retries with exponential backoff, idempotent handlers, a Dead
  Letter Queue for poison messages, and a circuit breaker (Opossum) around
  downstream calls.
- **Observability:** structured logging (Pino), per-stage metrics, and a live
  dashboard so the system's health is visible, not guessed.
- **Correctness under load:** k6 load tests with documented results (throughput,
  p95, error rate) in this README — numbers, not adjectives.
- **Type-safe boundaries:** request/response and domain contracts shared via
  `packages/core` as Zod schemas, so the API and the dashboard can't drift.
- **Real auth on the console:** the dashboard is gated by Auth.js with two
  roles — operators may replay dead letters, viewers may only read. No mock
  data, no fake login.

## Design decisions

A few choices worth calling out, with the reasoning behind them:

- **Hexagonal architecture (ports & adapters).** The domain (`core/`) never
  imports infrastructure. Use-cases depend on ports (`OrderRepository`,
  `OrderQueries`, `QueueMetrics`); Drizzle/SQS adapters are wired in at the edge.
  Swapping Postgres or the queue transport never touches business logic.
- **One source of truth for contracts.** Response shapes live as Zod schemas in
  `@conveyor/core` and are consumed by both the API and the web app, so the two
  cannot drift out of sync.
- **Selectable event transport.** The API can publish via SNS (prod) or straight
  to SQS (local), chosen by config — the same code path runs in both.
- **Polling over WebSockets, for now.** The console refreshes via SWR polling
  (~2–3s) — simple, robust, and plenty for an ops view. SSE/WebSockets are a
  deliberate future upgrade, not premature complexity.
- **LocalStack in development.** SQS/SNS run locally via LocalStack to mirror AWS
  without cost, keeping dev and prod on the same APIs.
- **Public reads, authorised writes.** Keeping the read endpoints open is what
  makes the hosted Swagger worth publishing; the write path is the one that can
  change the system, so it is the one that is locked down. The console acts as
  the trusted caller, which keeps the shared secret out of the browser.

## Tech stack

| Layer         | Tech                                                                |
| ------------- | ------------------------------------------------------------------- |
| API           | NestJS, class-validator, Swagger/OpenAPI                            |
| Worker        | Node.js, AWS SDK v3 (SQS/SNS), Opossum (circuit breaker)            |
| Dashboard     | Next.js (App Router), Tailwind, SWR (polling), Recharts, Auth.js v5 |
| Data          | Postgres + Drizzle ORM                                              |
| Validation    | Zod (contracts & config) + class-validator (API DTOs)               |
| Observability | Pino structured logs, k6 load tests                                 |
| Tooling       | pnpm workspaces, Turborepo, Docker (multi-stage), GitHub Actions CI |

## Project layout

A pnpm + Turborepo monorepo:

```
apps/
  api        NestJS — REST + Swagger; accepts orders, exposes metrics & DLQ ops
  worker     Resilient consumer — SQS/SNS, retries, backoff, DLQ, circuit breaker
  web        Next.js ops console — auth + real-time charts over the API
packages/
  core       Shared domain types & API contracts (single source of truth)
  db         Drizzle schema, migrations and client
  config     Shared tsconfig / eslint / prettier presets
```

## Getting started

**Prerequisites:** Node.js ≥ 20, [pnpm](https://pnpm.io/) 10, and Docker.

```bash
pnpm install
pnpm infra:up     # Postgres + LocalStack (SQS/SNS) via Docker
pnpm db:migrate   # apply Drizzle migrations
pnpm dev          # runs api + worker + web via Turborepo
```

Each app reads its config from a local `.env` — copy the `.env.example` in each
`apps/*` folder and adjust as needed.

| Service            | URL                          |
| ------------------ | ---------------------------- |
| API                | <http://localhost:3000>      |
| Swagger / API docs | <http://localhost:3000/docs> |
| Ops console (web)  | <http://localhost:3001>      |

**Common scripts** (run from the repo root):

```bash
pnpm build         # build every package/app
pnpm lint          # eslint across the workspace
pnpm typecheck     # tsc --noEmit across the workspace
pnpm test          # run unit tests
pnpm format        # prettier --write
```

## Roadmap

- [x] Monorepo scaffold (pnpm + Turborepo, shared `core` package)
- [x] `worker`: SQS/SNS consumer with retries, backoff, DLQ
- [x] `worker`: circuit breaker + idempotency + structured logging
- [x] `api`: NestJS REST + Swagger (submit orders, read status, paginated list)
- [x] `api`: observability endpoints (metrics summary, queue & DLQ depth)
- [x] Postgres schema + migrations (orders, processing log, dead letters, metrics)
- [x] `web`: ops console — live throughput, queue depth, message status
- [x] `worker`: persist failed attempts, dead letters and breaker transitions
- [x] `api`: dead-letter inspection + replay, breaker state, failure series
- [x] `web`: DLQ inspection + replay, circuit-breaker state
- [x] `web`: real authentication (Auth.js) — GitHub OAuth + read-only demo
- [ ] k6 load tests + documented results in this README
- [ ] CI (lint, test, build) + Docker images
- [ ] Deploy (Railway) with public Swagger + live dashboard demo

## License

MIT © Cristian Daniel Fernandes
