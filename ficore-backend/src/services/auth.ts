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
export const jwtRequired = async (req: Request, res: Response, next: NextFunction) => {
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
    
    // Find the user in the database and attach the Mongoose document to the request
    const user = await UserModel.findById(decoded.id);

    if (!user) {
      logger.warn('Unauthorized access: User not found from token', { userId: decoded.id });
      return res.status(401).json({ error: 'Unauthorized: User not found' });
    }

    req.user = user;

    logger.info('Token validated successfully', { userId: decoded.id });
    next();
  } catch (error) {
    logger.error('Token validation failed', { error, path: req.path });
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
};

/**
 * Placeholder for user login. 
 * This function should be implemented with real logic.
 */
export const login = async (email: string, password: string) => {
    // Logic to find user and check password
    // ...
    return { success: true, message: 'Login successful' };
};

/**
 * Placeholder for user registration. 
 * This function should be implemented with real logic.
 */
export const register = async (display_name: string, email: string, password: string) => {
    // Logic to create a new user
    // ...
    return { success: true, message: 'Registration successful' };
};
