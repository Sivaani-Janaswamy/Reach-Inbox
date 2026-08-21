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
- [x] **Test: schedule 1 email 30s out, confirm it sends and DB updates**

### Current progress note
- The campaign API and worker were exercised with real CSV submissions.
- Persistence and BullMQ job creation were verified successfully.
- Worker SMTP transports now use each sender's stored credentials, with a generated Ethereal fallback for demo placeholders.
- Initial campaign timestamps now distribute recipients across hourly-cap windows before jobs are enqueued.
- Confirmed a real test message to `sivaanijanaswamy@gmail.com` reached `sent` status with a recorded timestamp.
- The final send verification reached Ethereal but was blocked by `Greeting never received`, indicating external SMTP connectivity is unavailable or intermittent.

## Phase 3 — Persistence & restart safety (~2–3 hrs)
- [x] Enable Redis persistence (`appendonly yes`)
- [x] Startup reconciliation: on boot, find `emails` with status
      `scheduled`/`pending` and no live BullMQ job, re-enqueue them
- [x] Worker re-checks `emails.status` before sending (skip if already `sent`)
- [x] **Test: schedule email 2 min out, restart backend,
      restart before the 2 min elapses, confirm it still sends once, not
      zero or twice**

### Current progress note
- Redis AOF persistence is enabled and verified with `appendonly yes`.
- Backend startup now reconciles pending/scheduled database rows against BullMQ.
- The worker skips jobs whose database status is already `sent`.
- Restart test evidence: the test email reached `sent` and has exactly one successful send log.

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
- The first 20-email verification produced 20 `rate_limited_rescheduled` entries, but the old worker also emitted BullMQ missing-lock errors.
- The worker now throws BullMQ `DelayedError` after moving a rate-limited job; rerun the 20-email test to close this checkpoint.

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
- [x] Implement login flow (Passport on backend)
- [x] Session/JWT issuance, `GET /api/me`
- [x] Frontend: redirect to `/dashboard` after login; show name/email/avatar in header
- [x] Logout flow

### Current progress note
- Passport Google OAuth, Express sessions, `/auth/google`, callback, logout, and `/api/me` are implemented.
- Google Cloud credentials still need to be registered and added to `backend/.env`.
- Frontend login and dashboard integration remain for Phase 7.

## Phase 7 — Frontend dashboard (~5–7 hrs)
- [ ] Compare against provided Figma; note any deviations for the README
- [x] Reusable components: Button, Input, Table, Modal, StatusBadge, EmptyState, Toast
- [x] Dashboard shell: header (user info + logout), tabs (Scheduled/Sent), Compose button
- [x] Compose modal/page: subject, body, CSV upload with parsed count preview,
      start time, delay input, hourly limit input → `POST /api/campaigns`
- [x] Scheduled table: email/subject/scheduled time/status + loading + empty states
- [x] Sent table: email/subject/sent time/status + loading + empty states
- [x] Wire all API calls with typed request/response interfaces

### Current progress note
- The dashboard and compose workflow are live at `http://localhost:3000`.
- Scheduled and sent activity load from the backend API with loading, empty, and error states.
- CSV lead preview and campaign submission are wired to the scheduling endpoint.
- The `/dashboard` route is available for the OAuth callback, and the header loads the authenticated user from `/api/me` when a session exists.
- Shared UI primitives and typed API response contracts are now in place.
- Visual comparison and live OAuth credential testing remain.

## Phase 8 — Polish & load-behavior sanity check (~2 hrs)
- [ ] Schedule 1000 emails (script or CSV) for the same timestamp, confirm
      no crash, jobs drain per rate limit/concurrency settings
- [x] Basic toasts/error messages on failed API calls
- [x] Lint/typecheck pass on both backend and frontend
- [x] Automated backend smoke tests for health, authentication, and validation

### Current progress note
- A real 1000-recipient campaign was accepted without crashing.
- Verified 1000 database email rows and 1000 delayed BullMQ jobs were created.
- Full delivery drain and rate-limit behavior remain open because the campaign was intentionally scheduled in the future and SMTP delivery is externally dependent.
- Run automated backend tests with `npm --workspace backend test` before manual browser testing.

## Phase 9 — README & submission (~2 hrs)
- [x] README: run instructions (backend, Redis, DB, worker, frontend)
- [x] README: Ethereal setup + all env vars documented
- [x] README: architecture overview (scheduling, persistence, rate limiting/concurrency)
- [x] README: feature checklist mapped to backend/frontend requirements
- [x] README: assumptions/shortcuts/trade-offs section
- [ ] Record ≤5 min demo video: schedule emails, show tables, restart
      scenario, brief rate-limit-under-load demo
- [ ] Create private repo, grant access to `Mitrajit` and `Yadav036`
- [ ] Submit via the ClickUp form

## Non-negotiables to double-check before submitting
- [x] No cron anywhere (grep for `node-cron`, `agenda`, `crontab`)
- [ ] Restart scenario actually verified live, not just assumed
- [x] Rate limit counters are Redis/DB-backed, not in-memory
- [x] Duplicate sends are guarded by idempotent `jobId` + DB status re-check
