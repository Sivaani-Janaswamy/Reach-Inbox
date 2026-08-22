import { Router, type Request, type Response } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import { z } from 'zod';
import { prisma } from './lib/prisma.js';
import { config } from './config.js';

const router = Router();
const frontendUrl = config.frontendUrl;
const callbackUrl = config.googleCallbackUrl;
const googleConfigured = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
const localLoginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1).max(255).optional(),
});

async function ensureDefaultSender(userId: string) {
  const sender = await prisma.sender.findFirst({ where: { userId } });
  if (sender) return sender;

  return prisma.sender.create({
    data: {
      userId,
      name: 'Primary Sender',
      smtpUser: 'local-demo',
      smtpPass: 'local-demo',
      smtpHost: 'smtp.ethereal.email',
      smtpPort: 587,
      maxEmailsPerHour: 100,
    },
  });
}

if (googleConfigured) {
  passport.use(new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      callbackURL: callbackUrl,
    },
    async (_accessToken, _refreshToken, profile: Profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(new Error('Google account did not provide an email address'));
        const user = await prisma.user.upsert({
          where: { email },
          update: {
            googleId: profile.id,
            name: profile.displayName,
            avatarUrl: profile.photos?.[0]?.value,
          },
          create: {
            googleId: profile.id,
            email,
            name: profile.displayName,
            avatarUrl: profile.photos?.[0]?.value,
          },
        });
        done(null, user);
      } catch (error) {
        done(error as Error);
      }
    },
  ));
}

passport.serializeUser((user, done) => {
  done(null, (user as Express.User).id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user || false);
  } catch (error) {
    done(error);
  }
});

router.get('/google', (req, res, next) => {
  if (!googleConfigured) {
    res.status(503).json({ error: 'Google OAuth is not configured' });
    return;
  }
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
  if (!googleConfigured) {
    res.status(503).json({ error: 'Google OAuth is not configured' });
    return;
  }
  passport.authenticate('google', { failureRedirect: '/auth/google' })(req, res, () => {
    res.redirect(`${frontendUrl}/dashboard`);
  });
});

router.post('/local', async (req, res, next) => {
  try {
    const input = localLoginSchema.parse(req.body);
    const user = await prisma.user.upsert({
      where: { email: input.email },
      update: {
        name: input.name ?? input.email.split('@')[0],
      },
      create: {
        email: input.email,
        name: input.name ?? input.email.split('@')[0],
      },
    });
    await ensureDefaultSender(user.id);
    req.login(user, (error) => {
      if (error) {
        next(error);
        return;
      }
      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatarUrl,
        redirect: '/dashboard',
      });
    });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', (req, res, next) => {
  req.logout((error) => {
    if (error) {
      next(error);
      return;
    }
    req.session.destroy((sessionError) => {
      if (sessionError) {
        next(sessionError);
        return;
      }
      res.clearCookie('connect.sid');
      res.status(204).send();
    });
  });
});

export function currentUserHandler(req: Request, res: Response) {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const user = req.user as Express.User;
  res.json({ id: user.id, email: user.email, name: user.name, avatar_url: user.avatarUrl });
}

router.get('/me', currentUserHandler);

export { router as authRouter };
