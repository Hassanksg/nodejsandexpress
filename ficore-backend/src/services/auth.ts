import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { config } from './../config/env';
import { UserModel } from '../models/user';
import { UnauthorizedError, ValidationError } from '../types/errors';
import { logger } from '../utils/logger';
import { Request, Response, NextFunction } from 'express';

// Existing functions (login, register, validateToken) remain unchanged

export async function login(email: string, password: string) {
  const user = await UserModel.findOne({ email });
  if (!user) {
    logger.warn('Login attempt failed: User not found', { email });
    throw new UnauthorizedError('Invalid credentials');
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    logger.warn('Login attempt failed: Incorrect password', { email });
    throw new UnauthorizedError('Invalid credentials');
  }
  const token = jwt.sign(
    { id: user._id, display_name: user.display_name, email: user.email, role: user.role },
    config.jwtSecret,
    { expiresIn: '1d' }
  );
  logger.info('User logged in', { userId: user._id });
  return { success: true, token, user: { id: user._id, display_name: user.display_name, email: user.email } };
}

export async function register(display_name: string, email: string, password: string) {
  const existingUser = await UserModel.findOne({ email });
  if (existingUser) {
    logger.warn('Registration attempt failed: Email already exists', { email });
    throw new ValidationError('Email already exists');
  }
  const user = await UserModel.create({ display_name, email, password });
  logger.info('User registered', { userId: user._id });
  return { success: true, user: { id: user._id, display_name: user.display_name, email: user.email } };
}

export async function validateToken(token: string) {
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    return decoded;
  } catch (error) {
    logger.error('Token validation failed', { error });
    throw new UnauthorizedError('Invalid or expired token');
  }
}

/**
 * Middleware to check for a valid JWT token on protected routes.
 * It reads the token from the Authorization header and validates it.
 */
export async function jwtRequired(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = await validateToken(token);
    // Attach the decoded token payload to the request for use in controllers
    // Example: (req as any).user = decoded; 
    // This part requires your custom Request type to be defined.
    (req as any).user = decoded; // Temporary fix
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
}
