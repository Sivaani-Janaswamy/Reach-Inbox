import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import { ZodError } from 'zod';
import { authRouter, currentUserHandler } from './auth.js';
import { campaignsRouter } from './campaigns.js';
import { config } from './config.js';
import { reconcileScheduledEmails } from './reconcile.js';
import { apiRouter } from './api.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' },
}));
app.use(passport.initialize());
app.use(passport.session());

app.use('/auth', authRouter);
app.get('/api/me', currentUserHandler);

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'reachinbox-backend' });
});

app.get('/api', (_req, res) => {
  res.json({ message: 'ReachInbox backend is running' });
});

app.use('/api/campaigns', campaignsRouter);
app.use('/api', apiRouter);

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof ZodError) {
    res.status(400).json({ error: 'Validation failed', details: error.flatten().fieldErrors });
    return;
  }
  console.error(error);
  res.status(500).json({ error: 'Internal server error' });
});

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
