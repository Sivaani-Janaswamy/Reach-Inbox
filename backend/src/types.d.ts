import type { RequestHandler } from 'express';

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      name: string | null;
      avatarUrl: string | null;
    }

    interface Request {
      file?: Express.Multer.File;
    }
  }
}

export type AsyncRequestHandler = RequestHandler;
