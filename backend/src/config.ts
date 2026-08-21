import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT || 4000),
  databaseUrl: process.env.DATABASE_URL || 'postgresql://reachinbox:reachinbox@localhost:5432/reachinbox?schema=public',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  workerConcurrency: Number(process.env.WORKER_CONCURRENCY || 5),
  minDelayMs: Number(process.env.MIN_DELAY_MS || 1000),
  maxEmailsPerHourPerSender: Number(process.env.MAX_EMAILS_PER_HOUR_PER_SENDER || 100),
  maxEmailsPerHourGlobal: Number(process.env.MAX_EMAILS_PER_HOUR_GLOBAL || 500),
};
