import nodemailer from 'nodemailer';
import { Worker } from 'bullmq';
import { prisma } from './lib/prisma.js';
import { config } from './config.js';
import { redisConnection } from './queue.js';

async function createTransport() {
  if (process.env.ETHEREAL_USER && process.env.ETHEREAL_PASS) {
    return {
      transport: nodemailer.createTransport({
        host: process.env.ETHEREAL_HOST || 'smtp.ethereal.email',
        port: Number(process.env.ETHEREAL_PORT || 587),
        secure: false,
        auth: { user: process.env.ETHEREAL_USER, pass: process.env.ETHEREAL_PASS },
      }),
      from: process.env.ETHEREAL_USER,
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
}

const { transport, from } = await createTransport();

const worker = new Worker('email-send', async (job) => {
  const email = await prisma.email.findUnique({ include: { campaign: true, sender: true }, where: { id: job.data.emailId } });
  if (!email || email.status === 'sent') return;

  await prisma.email.update({ where: { id: email.id }, data: { status: 'sending', attempts: { increment: 1 } } });
  try {
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
}, { connection: redisConnection, concurrency: config.workerConcurrency });

worker.on('completed', (job) => console.log(`Email job ${job.id} completed`));
worker.on('failed', (job, error) => console.error(`Email job ${job?.id} failed`, error.message));
console.log(`Email worker running with concurrency ${config.workerConcurrency}`);
