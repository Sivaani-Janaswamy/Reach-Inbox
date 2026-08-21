import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { config } from './config.js';

export const redisConnection = new Redis(config.redisUrl, {
  maxRetriesPerRequest: null,
});

export const emailQueue = new Queue('email-send', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: 1000,
    removeOnFail: 5000,
  },
});
