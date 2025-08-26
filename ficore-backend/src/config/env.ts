import dotenv from 'dotenv';

dotenv.config();

export const config = {
  mongoUri: process.env.MONGO_URI || '',
  jwtSecret: process.env.JWT_SECRET_KEY || 'super-secret-key',
  allowedOrigins: ['http://localhost:8100', 'https://ficoreafrica.com'],
};