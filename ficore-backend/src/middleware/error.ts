// middleware/error.ts
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { ValidationError, NotFoundError, InsufficientCreditsError, UnauthorizedError, DatabaseError } from '../types/errors';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  logger.error('Unhandled error', { error: err, path: req.path });

  if (err instanceof ValidationError) {
    return res.status(400).json({ success: false, error: err.message });
  }
  if (err instanceof NotFoundError) {
    return res.status(404).json({ success: false, error: err.message });
  }
  if (err instanceof InsufficientCreditsError) {
    return res.status(402).json({ success: false, error: err.message });
  }
  if (err instanceof UnauthorizedError) {
    return res.status(401).json({ success: false, error: err.message });
  }
  if (err instanceof DatabaseError) {
    return res.status(500).json({ success: false, error: err.message });
  }

  return res.status(500).json({ success: false, error: 'Internal server error' });
}