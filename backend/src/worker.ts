import nodemailer from 'nodemailer';
import { DelayedError, Worker } from 'bullmq';
import { prisma } from './lib/prisma.js';
import { config } from './config.js';
import { redisConnection } from './queue.js';
import { nextHourWithSequence, reserveSendSlot } from './rate-limit.js';

type SenderTransport = {
  transport: nodemailer.Transporter;
  from: string;
};

const transportCache = new Map<string, Promise<SenderTransport>>();

function createTransport(sender: { id: string; smtpUser: string; smtpPass: string; smtpHost: string; smtpPort: number }) {
  const cached = transportCache.get(sender.id);
  if (cached) return cached;

  const transportPromise = (async (): Promise<SenderTransport> => {
    const hasConfiguredCredentials = sender.smtpUser.includes('@') && sender.smtpPass.length > 0;
    if (hasConfiguredCredentials) {
      return {
        transport: nodemailer.createTransport({
          host: sender.smtpHost,
          port: sender.smtpPort,
          secure: sender.smtpPort === 465,
          auth: { user: sender.smtpUser, pass: sender.smtpPass },
        }),
        from: sender.smtpUser,
      };
    }

    const account = await nodemailer.createTestAccount();
    return {
      transport: nodemailer.createTransport({
        host: account.smtp.host,
        port: account.smtp.port,
        secure: account.smtp.secure,
        auth: { user: account.user, pass: account.pass },
      }),
      from: account.user,
    };
  })();

  transportCache.set(sender.id, transportPromise);
  return transportPromise;
}

const worker = new Worker('email-send', async (job) => {
  const email = await prisma.email.findUnique({ include: { campaign: true, sender: true }, where: { id: job.data.emailId } });
  if (!email || email.status === 'sent') return;

  const senderLimit = email.campaign.hourlyLimitOverride ?? email.sender.maxEmailsPerHour ?? config.maxEmailsPerHourPerSender;
  const hasSlot = await reserveSendSlot(email.senderId, senderLimit, config.maxEmailsPerHourGlobal);
  if (!hasSlot) {
    const nextRunAt = nextHourWithSequence(email.sequence);
    await prisma.$transaction([
      prisma.email.update({ where: { id: email.id }, data: { status: 'rescheduled', scheduledAt: nextRunAt } }),
      prisma.sendLog.create({ data: { emailId: email.id, attemptNumber: email.attempts + 1, outcome: 'rate_limited_rescheduled' } }),
    ]);
    await job.moveToDelayed(nextRunAt.getTime(), job.token);
    throw new DelayedError();
  }

  await prisma.email.update({ where: { id: email.id }, data: { status: 'sending', attempts: { increment: 1 } } });
  try {
    const { transport, from } = await createTransport(email.sender);
    const result = await transport.sendMail({
      from: `${email.sender.name} <${from}>`,
      to: email.recipientEmail,
      subject: email.campaign.subject,
      text: email.campaign.body,
    });
    await prisma.$transaction([
      prisma.email.update({ where: { id: email.id }, data: { status: 'sent', sentAt: new Date(), errorMessage: null } }),
      prisma.sendLog.create({ data: { emailId: email.id, attemptNumber: email.attempts + 1, outcome: 'sent', smtpMessageId: result.messageId } }),
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown SMTP error';
    await prisma.$transaction([
      prisma.email.update({ where: { id: email.id }, data: { status: 'failed', errorMessage: message } }),
      prisma.sendLog.create({ data: { emailId: email.id, attemptNumber: email.attempts + 1, outcome: 'failed', errorMessage: message } }),
    ]);
    throw error;
  }
}, {
  connection: redisConnection,
  concurrency: config.workerConcurrency,
  limiter: { max: 1, duration: config.minDelayMs },
});

worker.on('completed', (job) => console.log(`Email job ${job.id} completed`));
worker.on('failed', (job, error) => console.error(`Email job ${job?.id} failed`, error.message));
console.log(`Email worker running with concurrency ${config.workerConcurrency}`);
