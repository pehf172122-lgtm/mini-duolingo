import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  // Log interno completo (no enviado al cliente)
  console.error(err);

  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  const errorMessage = status === 500 ? 'Internal Server Error' : message;

  res.status(status).json({
    success: false,
    message,
    data: null,
    error: errorMessage
  });
}