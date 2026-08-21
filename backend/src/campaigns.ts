import { Router } from 'express';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import { prisma } from './lib/prisma.js';
import { emailQueue } from './queue.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const router = Router();
const demoUserEmail = 'demo@reachinbox.local';

function parseRecipientEmails(csv: string): string[] {
  const records = parse(csv, { columns: true, skip_empty_lines: true, trim: true }) as Record<string, string>[];
  const emails = records.flatMap((record) => {
    const value = record.email ?? record.Email ?? Object.values(record)[0];
    return value ? [value.trim().toLowerCase()] : [];
  });
  return [...new Set(emails)].filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
}

router.post('/', upload.single('leads'), async (req, res, next) => {
  try {
    const { subject, body, start_time: startTimeValue, delay_ms: delayMsValue, hourly_limit: hourlyLimitValue, sender_id: senderId } = req.body as Record<string, string>;
    if (!subject || !body || !startTimeValue || !req.file) {
      res.status(400).json({ error: 'subject, body, start_time, and leads CSV are required' });
      return;
    }

    const startTime = new Date(startTimeValue);
    const delayMs = Number(delayMsValue ?? 1000);
    const hourlyLimit = hourlyLimitValue ? Number(hourlyLimitValue) : null;
    if (Number.isNaN(startTime.getTime()) || !Number.isInteger(delayMs) || delayMs < 0 || (hourlyLimit !== null && (!Number.isInteger(hourlyLimit) || hourlyLimit <= 0))) {
      res.status(400).json({ error: 'Invalid scheduling values' });
      return;
    }

    const recipients = parseRecipientEmails(req.file.buffer.toString('utf8'));
    if (recipients.length === 0) {
      res.status(400).json({ error: 'The CSV contains no valid recipient emails' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email: demoUserEmail } });
    if (!user) {
      res.status(500).json({ error: 'Demo user is not seeded' });
      return;
    }
    const sender = senderId
      ? await prisma.sender.findFirst({ where: { id: senderId, userId: user.id } })
      : await prisma.sender.findFirst({ where: { userId: user.id }, orderBy: { createdAt: 'asc' } });
    if (!sender) {
      res.status(400).json({ error: 'No sender is configured' });
      return;
    }

    const campaign = await prisma.campaign.create({
      data: {
        userId: user.id,
        subject,
        body,
        startTime,
        delayBetweenEmailsMs: delayMs,
        hourlyLimitOverride: hourlyLimit,
        totalRecipients: recipients.length,
        status: 'active',
        emails: {
          create: recipients.map((recipientEmail, sequence) => ({
            senderId: sender.id,
            recipientEmail,
            sequence,
            scheduledAt: new Date(startTime.getTime() + sequence * delayMs),
            status: 'pending',
          })),
        },
      },
      include: { emails: true },
    });

    await Promise.all(campaign.emails.map(async (email) => {
      await emailQueue.add('send-email', { emailId: email.id }, {
        jobId: email.id,
        delay: Math.max(0, email.scheduledAt.getTime() - Date.now()),
      });
      await prisma.email.update({ where: { id: email.id }, data: { status: 'scheduled', jobId: email.id } });
    }));

    res.status(201).json({ campaignId: campaign.id, leadCount: recipients.length, status: 'scheduled' });
  } catch (error) {
    next(error);
  }
});

export { router as campaignsRouter };
