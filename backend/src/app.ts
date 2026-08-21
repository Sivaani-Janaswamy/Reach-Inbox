import express from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import { ZodError } from 'zod';
import { authRouter, currentUserHandler } from './auth.js';
import { campaignsRouter } from './campaigns.js';
import { apiRouter } from './api.js';
import { config } from './config.js';

export const app = express();

app.use(cors({ origin: true, credentials: true }));
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
app.get('/health', (_req, res) => res.json({ ok: true, service: 'reachinbox-backend' }));
app.get('/api', (_req, res) => res.json({ message: 'ReachInbox backend is running' }));
app.get('/api/me', currentUserHandler);
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
