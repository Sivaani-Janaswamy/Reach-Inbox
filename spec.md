# ReachInbox Email Scheduler — Technical Specification

## 1. Overview

A production-grade email scheduler service + dashboard that accepts email
send requests, schedules them via BullMQ (Redis-backed, no cron), sends
through Ethereal SMTP, survives restarts without duplicate/lost jobs, and
exposes a React/Next.js dashboard for scheduling and monitoring.

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Backend language | TypeScript |
| Backend framework | Express.js |
| Queue | BullMQ (Redis-backed) |
| Database | PostgreSQL (or MySQL) via Prisma/Knex |
| SMTP | Ethereal Email (nodemailer transport) |
| Frontend | Next.js + TypeScript |
| Styling | Tailwind CSS |
| Auth | Google OAuth 2.0 |
| Infra | Docker Compose (Redis + Postgres) |

## 3. High-Level Architecture

```
[Frontend: Next.js]
       │  REST API (JWT/session)
       ▼
[Express API Server] ──writes──▶ [Postgres: campaigns, emails, senders]
       │
       │ enqueue delayed job (send-email)
       ▼
[BullMQ Queue "email-send"] ◀── backed by ──▶ [Redis]
       │
       ▼
[BullMQ Worker(s)] ── rate-limit check (Redis counters) ──▶
       │
       ├─ under limit → send via Ethereal SMTP → update DB (sent/failed)
       └─ over limit  → re-schedule job into next hour window (delay)
```

Key principle: **the DB is the source of truth for "what should exist";
BullMQ + Redis is the source of truth for "when it runs."** On restart,
BullMQ's persisted job store (in Redis) already has all delayed jobs with
their `delay`/`timestamp`, so nothing needs to be re-derived from the DB —
jobs just resume. A startup reconciliation job additionally scans the DB for
any `emails` rows in `scheduled` state with no matching active BullMQ job
(defensive, covers edge cases like a Redis wipe) and re-enqueues only those.

## 4. Data Flow

### 4.1 Scheduling a batch
1. User composes email (subject, body, leads CSV, start time, delay, hourly limit).
2. Frontend uploads CSV → backend parses → dedupes → creates one `campaigns`
   row and N `emails` rows (`status = 'pending'`).
3. Backend computes a send timestamp for each email: `start_time + (index * delay_between_emails)`,
   respecting the hourly cap by rolling overflow into the next hour window.
4. For each email, enqueue a BullMQ job on queue `email-send` with
   `delay = sendTime - now`, `jobId = emails.id` (ensures idempotency — BullMQ
   rejects/no-ops a duplicate `jobId`).
5. `emails.status` → `scheduled`, `emails.job_id` stored.

### 4.2 Worker execution
1. Worker picks up job at its scheduled time (concurrency configurable via
   `WORKER_CONCURRENCY` env var, default 5).
2. Worker checks a Redis counter `rate:{sender_id}:{hour_bucket}`
   (INCR + EXPIRE, atomic via Lua/`multi`).
   - If count ≤ `MAX_EMAILS_PER_HOUR_PER_SENDER`: proceed to send.
   - If over limit: do **not** fail the job — re-enqueue with a new delay
     that lands in the next hour window (`job.moveToDelayed` or re-add with
     `delay`), preserving the original relative order via a monotonic
     `sequence` field used as a tiebreaker.
3. On send: call Ethereal SMTP via nodemailer, enforce the configured
   min-delay-between-sends using BullMQ's `limiter` option
   (`{ max: 1, duration: MIN_DELAY_MS }` per worker) as the primary
   mechanism, so concurrency and pacing are both queue-level, not ad hoc
   `setTimeout`s.
4. On success: update `emails.status = 'sent'`, `sent_at = now()`, log to
   `send_log`.
5. On failure: update `emails.status = 'failed'`, `error_message`, use
   BullMQ's built-in retry (`attempts: 3`, exponential backoff).

### 4.3 Idempotency & restart safety
- `jobId = emails.id` → BullMQ guarantees a job with that id can only exist
  once in the queue; re-running the enqueue step (e.g. after a crash mid-batch)
  is a safe no-op for already-queued emails.
- Before sending, the worker re-checks `emails.status` in the DB; if it's
  already `sent`, the job completes immediately without re-sending
  (defense against a rare double-delivery from Redis/Postgres desync).
- Redis persistence (`appendonly yes` in `redis.conf`, or RDB snapshotting)
  ensures delayed jobs survive a Redis restart; Postgres is the durable
  record regardless.

## 5. Rate Limiting Design

- **Granularity:** per-sender per-hour, env-configurable
  (`MAX_EMAILS_PER_HOUR_PER_SENDER`), with an optional global cap
  (`MAX_EMAILS_PER_HOUR_GLOBAL`) checked in addition.
- **Storage:** Redis key `rate:{senderId}:{YYYYMMDDHH}`, `INCR` then `EXPIRE 3600`
  if newly created — done atomically to be safe across multiple worker
  processes/instances.
- **Overflow behavior:** never drop a job. If a sender's hour bucket is full,
  the job is delayed to `nextHourBoundary + smallJitterMs` (jitter avoids a
  thundering herd of jobs all retrying at exactly :00:00). Original
  scheduling order is preserved using a `sequence` integer per campaign as a
  secondary sort key when multiple jobs roll into the same new window.
- **Trade-off documented in README:** Redis counters are eventually
  consistent with wall-clock hour boundaries; a job scheduled at 12:59:58
  that gets delayed could in rare cases send at 13:00:00 exactly at the
  boundary — acceptable given the ±few-second tolerance of "per hour" rate
  limiting for cold email.

## 6. API Endpoints (backend)

| Method | Path | Purpose |
|---|---|---|
| GET | `/auth/google` | Start Google OAuth flow |
| GET | `/auth/google/callback` | OAuth callback, issues session/JWT |
| POST | `/auth/logout` | Clear session |
| GET | `/api/me` | Current user (name, email, avatar) |
| POST | `/api/campaigns` | Create campaign: subject, body, leads (CSV upload), start_time, delay_ms, hourly_limit |
| GET | `/api/campaigns/:id` | Campaign detail + stats |
| GET | `/api/emails?status=scheduled` | Paginated list of scheduled emails |
| GET | `/api/emails?status=sent` | Paginated list of sent/failed emails |
| POST | `/api/senders` | Register a sender identity (Ethereal account) |
| GET | `/api/senders` | List configured senders |

## 7. Frontend Requirements

- **Auth:** real Google OAuth (NextAuth.js or manual passport-google-oauth20
  flow) → redirect to `/dashboard`; header shows name, email, avatar,
  logout.
- **Dashboard:** tabs for Scheduled / Sent, "Compose New Email" primary
  action, matching the provided Figma.
- **Compose modal/page:** subject, body, CSV upload with parsed
  lead-count preview, start time picker, delay-between-emails input,
  hourly-limit input → POST to `/api/campaigns`.
- **Scheduled table:** email, subject, scheduled time, status; loading +
  empty states.
- **Sent table:** email, subject, sent time, status (`sent`/`failed`);
  loading + empty states.
- Reusable components: `<Button>`, `<Input>`, `<Table>`, `<Modal>`,
  `<StatusBadge>`, `<EmptyState>`, `<Toast>`.

## 8. Non-Functional Requirements

- No cron (OS-level or `node-cron`/`agenda`) anywhere in the system.
- Configurable via `.env`: `WORKER_CONCURRENCY`, `MIN_DELAY_MS`,
  `MAX_EMAILS_PER_HOUR_PER_SENDER`, `MAX_EMAILS_PER_HOUR_GLOBAL`,
  `DATABASE_URL`, `REDIS_URL`, `ETHEREAL_*`, `GOOGLE_CLIENT_ID/SECRET`.
- Must demonstrably survive: `docker compose stop backend && docker compose start backend`
  with pending scheduled emails still firing at the correct time.
- README must cover run instructions, architecture, and the rate-limit/
  persistence trade-offs above.

## 9. Assumptions / Out of Scope (for the README's "assumptions" section)

- Ethereal is a fake SMTP catcher — "sent" means accepted by Ethereal, not
  delivered to a real inbox; there's no bounce/open tracking.
- Multi-tenant auth (multiple orgs) is out of scope; Google login identifies
  a single user whose campaigns are scoped to their `user_id`.
- 1000+ email load is handled by design (delayed jobs + rate-limited worker
  drain) but not load-tested against real Ethereal rate limits in the demo.
