// ficore-backend/src/services/auth.ts
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';
import { logger } from '../utils/logger';
import { UnauthorizedError } from '../types/errors';
import { UserDocument, UserModel } from '../models/user';

/**
 * Middleware to check for a valid JWT token on protected routes.
 * It reads the token from the Authorization header and validates it.
 */
export const jwtRequired = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  // Check if Authorization header exists and starts with 'Bearer '
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('Unauthorized access attempt: No token provided', { path: req.path });
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  // Extract token from 'Bearer <token>'
  const token = authHeader.split(' ')[1];

  // Check if token exists
  if (!token) {
    logger.warn('Unauthorized access attempt: Invalid token format', { path: req.path });
    return res.status(401).json({ error: 'Unauthorized: Invalid token format' });
  }

  try {
    // Verify token with type assertion for decoded payload
    const decoded = jwt.verify(token, config.jwtSecret) as {
      id: string;
      display_name: string;
      email: string;
      role: string;
      iat?: number;
      exp?: number;
    };
    
    // Attach decoded payload to request
    // This is the correct way to assign the user object to the request
    req.user = new UserModel({
      _id: decoded.id,
      display_name: decoded.display_name,
      email: decoded.email,
      role: decoded.role,
      ficore_credit_balance: 0 // Placeholder or fetched from DB
    });

    logger.info('Token validated successfully', { userId: decoded.id });
    next();
  } catch (error) {
    logger.error('Token validation failed', { error, path: req.path });
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
};
