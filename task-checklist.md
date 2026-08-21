# ReachInbox Assignment — Task Checklist (48-hour budget)

Suggested order: get an end-to-end vertical slice working first (one email,
scheduled, sent, restart-safe), then layer on rate limiting, then the
frontend polish. Don't build every table/endpoint before wiring one path
through.

## Phase 0 — Setup (~1–2 hrs)
- [x] Init monorepo: `/backend`, `/frontend`, root `README.md`
- [x] `docker-compose.yml` for Postgres + Redis
- [x] Backend: Express + TypeScript scaffold, `tsconfig`, `nodemon`/`ts-node-dev`
- [x] Set up ORM/query builder (Prisma recommended for speed) + connect to DB
- [x] Set up BullMQ + ioredis connection
- [x] Create Ethereal test account(s) via `nodemailer.createTestAccount()`, store creds in `.env`
- [x] Frontend: Next.js + TypeScript + Tailwind scaffold

### Current progress note
- Base monorepo and app shell have been created.
- Backend and frontend both compile successfully.
- Docker Compose, Prisma, Postgres, Redis, BullMQ, and SMTP fallback wiring are ready.

## Phase 1 — DB schema (~1 hr)
- [x] Create `users`, `senders`, `campaigns`, `emails`, `send_log` tables (see database.md)
- [x] Write migrations (Prisma Migrate or equivalent)
- [x] Seed script: 1 demo user + 2 Ethereal senders

### Current progress note
- Prisma schema validates successfully.
- Initial migration `20260821155525_init_schema` has been applied successfully.
- Seed completed with one demo user and two demo senders.
- Verified that all six expected tables exist in Postgres.

## Phase 2 — Core scheduler vertical slice (~4–6 hrs)
- [x] `POST /api/campaigns`: accept subject/body/CSV/start_time/delay/hourly_limit
- [x] CSV parsing + dedup + lead-count response
- [x] Compute `scheduled_at` per email (start_time + index * delay)
- [x] Insert `campaigns` + `emails` rows
- [x] Enqueue one BullMQ delayed job per email, `jobId = email.id`
- [x] Worker: consume `email-send` queue, send via Ethereal, update `emails.status`
- [ ] **Test: schedule 1 email 30s out, confirm it sends and DB updates**

### Current progress note
- The campaign API and worker were exercised with real CSV submissions.
- Persistence and BullMQ job creation were verified successfully.
- Worker SMTP transports now use each sender's stored credentials, with a generated Ethereal fallback for demo placeholders.
- The final send verification reached Ethereal but was blocked by `Greeting never received`, indicating external SMTP connectivity is unavailable or intermittent.

## Phase 3 — Persistence & restart safety (~2–3 hrs)
- [x] Enable Redis persistence (`appendonly yes`)
- [x] Startup reconciliation: on boot, find `emails` with status
      `scheduled`/`pending` and no live BullMQ job, re-enqueue them
- [x] Worker re-checks `emails.status` before sending (skip if already `sent`)
- [ ] **Test: schedule email 2 min out, `docker compose stop backend`,
      restart before the 2 min elapses, confirm it still sends once, not
      zero or twice**

### Current progress note
- Redis AOF persistence is enabled and verified with `appendonly yes`.
- Backend startup now reconciles pending/scheduled database rows against BullMQ.
- The worker skips jobs whose database status is already `sent`.
- The live backend restart scenario remains to be tested after SMTP connectivity is available.

## Phase 4 — Concurrency, pacing, rate limiting (~4–6 hrs)
- [x] `WORKER_CONCURRENCY` env var wired into BullMQ worker options
- [x] Min delay between sends via BullMQ `limiter` option (document the chosen value in README)
- [x] Redis-backed per-sender hourly counter (`INCR` + `EXPIRE`, atomic)
- [x] On limit exceeded: reschedule job into next hour window (don't fail/drop)
- [x] `sequence` field used to preserve order on rescheduled batches
- [x] Global hourly cap (optional, if doing both global + per-sender)
- [ ] **Test: set `MAX_EMAILS_PER_HOUR_PER_SENDER=5`, schedule 20 for the
      same minute, confirm 5 send and the rest roll into the next hour**

### Current progress note
- BullMQ concurrency and minimum-delay pacing are configured in the worker.
- Sender and global rate counters use atomic Redis Lua operations with expiry.
- Rate-limited jobs are rescheduled at the next UTC hour with sequence offsets.
- The live 20-email verification remains open while Ethereal SMTP connectivity is unavailable.

## Phase 5 — Remaining backend endpoints (~2 hrs)
- [x] `GET /api/emails?status=scheduled` (paginated)
- [x] `GET /api/emails?status=sent`
- [x] `GET /api/campaigns/:id`
- [x] `GET /api/senders`, `POST /api/senders`
- [x] Basic error handling / validation middleware

### Current progress note
- Email list, campaign detail, and sender endpoints were tested against live Postgres data.
- Invalid sender input returned HTTP 400 through the centralized validation handler.

## Phase 6 — Google OAuth (~2–3 hrs)
- [ ] Register OAuth app in Google Cloud Console, get client id/secret
- [ ] Implement login flow (NextAuth.js on frontend, or Passport on backend)
- [ ] Session/JWT issuance, `GET /api/me`
- [ ] Frontend: redirect to `/dashboard` after login; show name/email/avatar in header
- [ ] Logout flow

## Phase 7 — Frontend dashboard (~5–7 hrs)
- [ ] Compare against provided Figma; note any deviations for the README
- [ ] Reusable components: Button, Input, Table, Modal, StatusBadge, EmptyState, Toast
- [ ] Dashboard shell: header (user info + logout), tabs (Scheduled/Sent), Compose button
- [ ] Compose modal/page: subject, body, CSV upload with parsed count preview,
      start time, delay input, hourly limit input → `POST /api/campaigns`
- [ ] Scheduled table: email/subject/scheduled time/status + loading + empty states
- [ ] Sent table: email/subject/sent time/status + loading + empty states
- [ ] Wire all API calls with typed request/response interfaces

## Phase 8 — Polish & load-behavior sanity check (~2 hrs)
- [ ] Schedule 1000 emails (script or CSV) for the same timestamp, confirm
      no crash, jobs drain per rate limit/concurrency settings
- [ ] Basic toasts/error messages on failed API calls
- [ ] Lint/typecheck pass on both backend and frontend

## Phase 9 — README & submission (~2 hrs)
- [ ] README: run instructions (backend, Redis, DB, worker, frontend)
- [ ] README: Ethereal setup + all env vars documented
- [ ] README: architecture overview (scheduling, persistence, rate limiting/concurrency)
- [ ] README: feature checklist mapped to backend/frontend requirements
- [ ] README: assumptions/shortcuts/trade-offs section
- [ ] Record ≤5 min demo video: schedule emails, show tables, restart
      scenario, brief rate-limit-under-load demo
- [ ] Create private repo, grant access to `Mitrajit` and `Yadav036`
- [ ] Submit via the ClickUp form

## Non-negotiables to double-check before submitting
- [ ] No cron anywhere (grep for `node-cron`, `agenda`, `crontab`)
- [ ] Restart scenario actually verified live, not just assumed
- [ ] Rate limit counters are Redis/DB-backed, not in-memory
- [ ] Duplicate sends are impossible (idempotent `jobId` + DB status re-check)
