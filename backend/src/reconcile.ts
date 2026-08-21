import { prisma } from './lib/prisma.js';
import { emailQueue } from './queue.js';

export async function reconcileScheduledEmails(): Promise<number> {
  const emails = await prisma.email.findMany({
    where: { status: { in: ['pending', 'scheduled'] } },
    select: { id: true, scheduledAt: true, status: true },
  });
  let requeued = 0;

  for (const email of emails) {
    const existingJob = await emailQueue.getJob(email.id);
    if (existingJob) continue;

    await emailQueue.add(
      'send-email',
      { emailId: email.id },
      {
        jobId: email.id,
        delay: Math.max(0, email.scheduledAt.getTime() - Date.now()),
      },
    );
    await prisma.email.update({
      where: { id: email.id },
      data: { status: 'scheduled', jobId: email.id },
    });
    requeued += 1;
  }

  return requeued;
}
