import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { campaignsRouter } from './campaigns.js';
import { config } from './config.js';
import { reconcileScheduledEmails } from './reconcile.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'reachinbox-backend' });
});

app.get('/api', (_req, res) => {
  res.json({ message: 'ReachInbox backend is running' });
});

app.use('/api/campaigns', campaignsRouter);

async function start() {
  const requeued = await reconcileScheduledEmails();
  app.listen(config.port, () => {
    console.log(`Backend listening on http://localhost:${config.port}`);
    console.log(`Reconciled ${requeued} scheduled email job(s)`);
  });
}

start().catch((error) => {
  console.error('Backend startup failed', error);
  process.exit(1);
});
