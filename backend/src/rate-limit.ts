import { redisConnection } from './queue.js';

const reserveScript = `
local senderCount = redis.call('INCR', KEYS[1])
if senderCount == 1 then redis.call('EXPIRE', KEYS[1], 3600) end
if senderCount > tonumber(ARGV[1]) then
  redis.call('DECR', KEYS[1])
  return 0
end
local globalCount = redis.call('INCR', KEYS[2])
if globalCount == 1 then redis.call('EXPIRE', KEYS[2], 3600) end
if globalCount > tonumber(ARGV[2]) then
  redis.call('DECR', KEYS[1])
  redis.call('DECR', KEYS[2])
  return 0
end
return 1
`;

function hourBucket(date = new Date()): string {
  return date.toISOString().slice(0, 13).replace('T', '');
}

export async function reserveSendSlot(senderId: string, senderLimit: number, globalLimit: number): Promise<boolean> {
  const bucket = hourBucket();
  const result = await redisConnection.eval(
    reserveScript,
    2,
    `rate:sender:${senderId}:${bucket}`,
    `rate:global:${bucket}`,
    senderLimit,
    globalLimit,
  );
  return result === 1;
}

export function nextHourWithSequence(sequence: number): Date {
  const nextHour = new Date();
  nextHour.setUTCMinutes(0, 0, 0);
  nextHour.setUTCHours(nextHour.getUTCHours() + 1);
  const jitterMs = Math.floor(Math.random() * 5000);
  nextHour.setTime(nextHour.getTime() + jitterMs + sequence * 10);
  return nextHour;
}
