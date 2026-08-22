# ReachInbox

ReachInbox is a full-stack email scheduler. It accepts recipient CSV files,
creates durable campaign records in PostgreSQL, schedules one BullMQ job per
recipient in Redis, and sends through Ethereal SMTP.
https://reachinbox-backend-46xu.onrender.com

## Stack

- Backend: TypeScript, Express, Prisma, BullMQ, Nodemailer
- Frontend: Next.js, TypeScript, Tailwind CSS
- Infrastructure: PostgreSQL and Redis through Docker Compose
- Authentication: Passport Google OAuth with Express sessions

## Local setup

Prerequisites: Node.js 18 or newer, npm, Docker Desktop, and Git.

```powershell
npm install
npm run docker:up
Copy-Item backend\.env.example backend\.env
Set-Location backend
npx prisma migrate dev --name init_schema
npm run seed
```

The development Postgres port is `15432` because port `5432` may already be
used by a local PostgreSQL installation. Redis uses port `6379`.

Open three terminals from the repository root:

```powershell
npm run backend:dev
npm --workspace backend run worker
npm run frontend:dev
```

URLs:

- Dashboard: http://localhost:3000
- OAuth callback: http://localhost:4000/auth/google/callback
- Backend health: http://localhost:4000/health

## Environment

Copy `backend/.env.example` to `backend/.env` and set:

- `DATABASE_URL` and `REDIS_URL` for local services
- `WORKER_CONCURRENCY` and `MIN_DELAY_MS` for worker behavior
- `MAX_EMAILS_PER_HOUR_PER_SENDER` and `MAX_EMAILS_PER_HOUR_GLOBAL` for caps
- `ETHEREAL_*` for a persistent SMTP account; the worker can create a test account when these are empty
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, and `SESSION_SECRET` for OAuth

Google Cloud must allow the callback URL exactly as configured above.

## Architecture

The database is the durable source of truth for users, senders, campaigns, and
email status. BullMQ and Redis own execution timing. The API creates campaign
and email rows before adding delayed jobs with `jobId = email.id`. The worker
re-checks the database status before sending and records outcomes in `send_log`.

On API startup, reconciliation scans pending, scheduled, and rescheduled rows.
It preserves live BullMQ jobs and re-enqueues missing or stale jobs. Redis runs
with append-only persistence enabled in Docker Compose.

## Rate limiting

BullMQ applies `MIN_DELAY_MS` between sends. Redis Lua operations reserve sender
and global hourly slots atomically, with one-hour key expiry. A job that cannot
reserve a slot is delayed until the next UTC hour with a small sequence offset,
so it is not dropped and campaign order is retained.

## API endpoints

- `POST /api/campaigns` - create a campaign from a CSV upload
- `GET /api/emails?status=scheduled` - paginated scheduled activity
- `GET /api/emails?status=sent` - paginated sent and failed activity
- `GET /api/campaigns/:id` - campaign details and status counts
- `GET /api/senders` and `POST /api/senders` - sender management
- `GET /api/me` - current authenticated user
- `GET /auth/google` and `GET /auth/google/callback` - Google login
- `POST /auth/logout` - end the current session

## Assumptions and limitations

- Ethereal accepts test messages but does not deliver to real inboxes.
- SMTP availability is external and may prevent live delivery tests.
- The current local demo falls back to a generated Ethereal account when sender credentials are placeholders.
- OAuth credentials and Google Cloud registration are required for real login.
- The current frontend is designed around the supplied requirements; exact Figma comparison requires the Figma source.
- Multi-tenant organizations, bounce tracking, opens, and production secret storage are out of scope.

## Verification status

- Backend and frontend production builds pass.
- Prisma migration and seed pass against Docker Postgres.
- Redis AOF and atomic rate limiting have been verified.
- A real 1000-recipient campaign was accepted with 1000 database rows and 1000 delayed BullMQ jobs.
- Full long-running SMTP drain, restart demonstration, and real Google OAuth remain environment-dependent tests.
