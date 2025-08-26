import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config } from './config/env';
import { connectDB } from './config/db';
import mainRouter from './routes/index';
import { errorHandler } from './middleware/error';
import billRouter from './routes/api-bill';
import budgetRouter from './routes/api-budget';
import shoppingRouter from './routes/api-shopping';
import { logger } from './utils/logger';

const app = express();

app.use(cors({ origin: config.allowedOrigins, credentials: true }));
app.use(express.json());

// Main API routes
app.use('/api', mainRouter);
app.use('/api/bill', billRouter);
app.use('/api/budget', budgetRouter);
app.use('/api/shopping', shoppingRouter);

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', { error: err, path: req.path });
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

app.use(errorHandler);

connectDB().then(() => {
  app.listen(5000, () => logger.info('Server running on port 5000'));
});

export default app;
