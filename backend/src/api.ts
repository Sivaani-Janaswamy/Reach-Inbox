import { Router } from 'express';
import { z } from 'zod';
import { prisma } from './lib/prisma.js';

const router = Router();
const demoUserEmail = 'demo@reachinbox.local';
const emailStatuses = ['pending', 'scheduled', 'sending', 'sent', 'failed', 'rescheduled'] as const;

const senderSchema = z.object({
  name: z.string().trim().min(1).max(255),
  smtp_user: z.string().trim().email(),
  smtp_pass: z.string().min(1),
  smtp_host: z.string().trim().min(1).max(255).default('smtp.ethereal.email'),
  smtp_port: z.coerce.number().int().min(1).max(65535).default(587),
  max_emails_per_hour: z.coerce.number().int().positive().optional(),
});

async function getDemoUser() {
  const user = await prisma.user.findUnique({ where: { email: demoUserEmail } });
  if (!user) throw new Error('Demo user is not seeded');
  return user;
}

router.get('/emails', async (req, res, next) => {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status : 'scheduled';
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
    if (!emailStatuses.includes(status as (typeof emailStatuses)[number])) {
      res.status(400).json({ error: 'Invalid email status' });
      return;
    }

    const user = await getDemoUser();
    const where = {
      campaign: { userId: user.id },
      status: status === 'sent' ? { in: ['sent', 'failed'] } : status,
    };
    const [emails, total] = await prisma.$transaction([
      prisma.email.findMany({
        where,
        include: { campaign: { select: { subject: true } } },
        orderBy: status === 'sent' ? { sentAt: 'desc' } : { scheduledAt: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.email.count({ where }),
    ]);

    res.json({
      data: emails.map((email) => ({
        id: email.id,
        recipient_email: email.recipientEmail,
        subject: email.campaign.subject,
        scheduled_at: email.scheduledAt,
        sent_at: email.sentAt,
        status: email.status,
        error_message: email.errorMessage,
      })),
      pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/campaigns/:id', async (req, res, next) => {
  try {
    const user = await getDemoUser();
    const campaign = await prisma.campaign.findFirst({
      where: { id: req.params.id, userId: user.id },
      include: { emails: { orderBy: { sequence: 'asc' } } },
    });
    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    const stats = campaign.emails.reduce<Record<string, number>>((counts, email) => {
      counts[email.status] = (counts[email.status] || 0) + 1;
      return counts;
    }, {});
    res.json({ campaign, stats });
  } catch (error) {
    next(error);
  }
});

router.get('/senders', async (_req, res, next) => {
  try {
    const user = await getDemoUser();
    const senders = await prisma.sender.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true, smtpUser: true, smtpHost: true, smtpPort: true, maxEmailsPerHour: true, createdAt: true },
    });
    res.json({ data: senders });
  } catch (error) {
    next(error);
  }
});

router.post('/senders', async (req, res, next) => {
  try {
    const input = senderSchema.parse(req.body);
    const user = await getDemoUser();
    const sender = await prisma.sender.create({
      data: {
        userId: user.id,
        name: input.name,
        smtpUser: input.smtp_user,
        smtpPass: input.smtp_pass,
        smtpHost: input.smtp_host,
        smtpPort: input.smtp_port,
        maxEmailsPerHour: input.max_emails_per_hour,
      },
      select: { id: true, name: true, smtpUser: true, smtpHost: true, smtpPort: true, maxEmailsPerHour: true, createdAt: true },
    });
    res.status(201).json(sender);
  } catch (error) {
    next(error);
  }
});

export { router as apiRouter };
