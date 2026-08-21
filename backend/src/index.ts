import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { campaignsRouter } from './campaigns.js';
import { config } from './config.js';

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

app.listen(config.port, () => {
  console.log(`Backend listening on http://localhost:${config.port}`);
});
