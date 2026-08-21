import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config({ path: new URL('../.env', import.meta.url), override: true });

const prisma = new PrismaClient();

async function main() {
  const email = 'demo@reachinbox.local';

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: 'Demo User',
      googleId: 'demo-google-user',
      avatarUrl: 'https://example.com/avatar.png',
    },
  });

  const senderA = await prisma.sender.upsert({
    where: {
      id: 'demo-sender-1',
    },
    update: {},
    create: {
      id: 'demo-sender-1',
      userId: user.id,
      name: 'Demo Sender One',
      smtpUser: 'demo-user-1',
      smtpPass: 'demo-pass-1',
      smtpHost: 'smtp.ethereal.email',
      smtpPort: 587,
      maxEmailsPerHour: 100,
    },
  });

  const senderB = await prisma.sender.upsert({
    where: {
      id: 'demo-sender-2',
    },
    update: {},
    create: {
      id: 'demo-sender-2',
      userId: user.id,
      name: 'Demo Sender Two',
      smtpUser: 'demo-user-2',
      smtpPass: 'demo-pass-2',
      smtpHost: 'smtp.ethereal.email',
      smtpPort: 587,
      maxEmailsPerHour: 100,
    },
  });

  console.log('Seed complete:', { user: user.email, senderA: senderA.name, senderB: senderB.name });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
