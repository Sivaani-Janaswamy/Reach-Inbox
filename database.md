# ReachInbox Email Scheduler — Database Schema

Target: PostgreSQL (adjust types trivially for MySQL — e.g. `SERIAL` → `AUTO_INCREMENT`,
`TIMESTAMPTZ` → `DATETIME`, `JSONB` → `JSON`).

## ER Overview

```
users 1───* senders
users 1───* campaigns 1───* emails
senders 1───* emails
emails 1───* send_log
emails 1───1 rate_limit_counters (logical, via sender+hour bucket in Redis — not a table)
```

## 1. `users`

Stores the Google-authenticated user.

| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | default `gen_random_uuid()` |
| google_id | VARCHAR(255) UNIQUE | sub claim from Google |
| email | VARCHAR(255) UNIQUE NOT NULL | |
| name | VARCHAR(255) | |
| avatar_url | TEXT | |
| created_at | TIMESTAMPTZ | default now() |
| updated_at | TIMESTAMPTZ | default now() |

## 2. `senders`

Sender identities (Ethereal accounts) a user can send from — supports the
per-sender rate limit requirement.

| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| user_id | UUID (FK → users.id) | |
| name | VARCHAR(255) | display name |
| smtp_user | VARCHAR(255) | Ethereal user |
| smtp_pass | VARCHAR(255) | Ethereal pass (encrypt at rest or store in env for demo) |
| smtp_host | VARCHAR(255) | default `smtp.ethereal.email` |
| smtp_port | INT | default 587 |
| max_emails_per_hour | INT | overrides global default if set |
| created_at | TIMESTAMPTZ | |

Index: `(user_id)`

## 3. `campaigns`

One row per "Compose & Schedule" action.

| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| user_id | UUID (FK → users.id) | |
| subject | TEXT NOT NULL | |
| body | TEXT NOT NULL | |
| start_time | TIMESTAMPTZ NOT NULL | when sending begins |
| delay_between_emails_ms | INT NOT NULL | user-configured pacing |
| hourly_limit_override | INT NULL | overrides sender/global default if set |
| total_recipients | INT | denormalized count from CSV parse |
| status | VARCHAR(20) | `scheduling` \| `active` \| `completed` \| `cancelled` |
| created_at | TIMESTAMPTZ | |

Index: `(user_id, created_at DESC)`

## 4. `emails`

One row per recipient per campaign — this is the row BullMQ `jobId`s map to
1:1, which is what makes idempotency straightforward.

| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | used as BullMQ `jobId` |
| campaign_id | UUID (FK → campaigns.id) | |
| sender_id | UUID (FK → senders.id) | which sender this will send from |
| recipient_email | VARCHAR(255) NOT NULL | |
| sequence | INT NOT NULL | order within campaign, used as tiebreaker on rate-limit rescheduling |
| scheduled_at | TIMESTAMPTZ NOT NULL | computed send time (may be revised on rate-limit rollover) |
| status | VARCHAR(20) NOT NULL | `pending` \| `scheduled` \| `sending` \| `sent` \| `failed` \| `rescheduled` |
| job_id | VARCHAR(255) | BullMQ job id (== id, kept explicit for clarity/debugging) |
| attempts | INT DEFAULT 0 | mirrors BullMQ attemptsMade |
| error_message | TEXT NULL | last error, if failed |
| sent_at | TIMESTAMPTZ NULL | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

Indexes:
- `(campaign_id, sequence)`
- `(status, scheduled_at)` — powers the "scheduled emails" table query
- `(sender_id, status)` — powers rate-limit reconciliation / sent-emails-by-sender queries
- `job_id` UNIQUE — enforces one job per email at the DB level too

## 5. `send_log`

Append-only audit trail of every send attempt (useful for the demo video's
"show behavior under load" section and for debugging retries).

| Column | Type | Notes |
|---|---|---|
| id | BIGSERIAL (PK) | |
| email_id | UUID (FK → emails.id) | |
| attempt_number | INT | |
| outcome | VARCHAR(20) | `sent` \| `failed` \| `rate_limited_rescheduled` |
| smtp_message_id | VARCHAR(255) NULL | Ethereal message id on success |
| error_message | TEXT NULL | |
| occurred_at | TIMESTAMPTZ | default now() |

Index: `(email_id, occurred_at)`

## 6. Rate-limit counters (Redis, not Postgres)

Not a table — deliberately kept out of Postgres to avoid write contention
on hot counters. Documented here for completeness:

```
key:   rate:{sender_id}:{YYYYMMDDHH}
type:  INTEGER (via INCR)
ttl:   3600s (EXPIRE set on first INCR of the bucket)
```

## 7. Migration/seed notes

- Seed one demo `user`, 2–3 `senders` (Ethereal test accounts created via
  `nodemailer.createTestAccount()`), and leave `campaigns`/`emails` empty —
  the frontend "Compose" flow populates them.
- Use a proper migration tool (Prisma Migrate / Knex migrations / TypeORM
  migrations) rather than a hand-run `schema.sql`, since the README needs to
  show "how to run backend" reproducibly.
