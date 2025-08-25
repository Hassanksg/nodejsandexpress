import mongoose from 'mongoose';
import { config } from './env';
import { logger } from '../src/utils/logger';

export async function connectDB() {
  try {
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 50,
      minPoolSize: 5,
    });
    logger.info('MongoDB connection successful');
  } catch (error) {
    logger.error('MongoDB connection failed', { error });
    throw error;
  }
}