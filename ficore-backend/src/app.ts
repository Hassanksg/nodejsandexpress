import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config } from './config/env';
import { connectDB } from './config/db';
import mainRouter from './routes/index';
import { errorHandler } from './middleware/error';
import { logger } from './utils/logger';

const app = express();

app.use(cors({ origin: config.allowedOrigins, credentials: true }));
app.use(express.json());

// Main API routes
app.use('/api', mainRouter);

// Global error handler for unhandled errors
app.use(errorHandler);

connectDB().then(() => {
  logger.info('Database connected successfully');
});

export default app;
