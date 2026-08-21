# ReachInbox

A full-stack email scheduler built with Express, BullMQ, PostgreSQL, Redis, and Next.js.

## Stack

- Backend: TypeScript + Express
- Queue: BullMQ + Redis
- Database: PostgreSQL + Prisma
- Frontend: Next.js + TypeScript + Tailwind CSS
- Email transport: Ethereal SMTP via Nodemailer

## Local setup

1. Install Node.js 18+ and Docker Desktop.
2. Start infrastructure services:
   npm run docker:up
3. Install workspace dependencies:
   npm install
4. Start backend:
   npm run backend:dev
5. Start frontend:
   npm run frontend:dev

## Project structure

- backend/ — Express API and worker logic
- frontend/ — Next.js dashboard UI
- docker-compose.yml — Postgres and Redis development services

## Notes

This is the initial scaffold for the project. The next step is implementing the scheduler, queue worker, and dashboard features described in the spec files.

## Queue behavior

The worker uses `WORKER_CONCURRENCY` for parallel processing and BullMQ's limiter
to enforce `MIN_DELAY_MS` between sends. Redis Lua counters enforce per-sender
and global hourly limits atomically. Jobs that exceed a limit are delayed until
the next UTC hour and retain campaign order using their sequence number.
