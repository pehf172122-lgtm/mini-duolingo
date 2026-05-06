import { Request, Response, NextFunction } from 'express';

export function attachUser(req: Request, _res: Response, next: NextFunction) {
  const userId = req.headers['x-user-id'];

  if (userId && typeof userId === 'string') {
    req.user = { userId };
  }

  next();
}