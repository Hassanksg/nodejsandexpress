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
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', { error: err, path: (req as any).path });
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

app.use(errorHandler);

connectDB().then(() => {
  logger.info('Database connected successfully');
});

export default app;
