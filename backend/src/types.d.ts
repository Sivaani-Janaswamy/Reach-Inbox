import type { RequestHandler } from 'express';

declare global {
  namespace Express {
    interface Request {
      file?: Express.Multer.File;
    }
  }
}

export type AsyncRequestHandler = RequestHandler;
