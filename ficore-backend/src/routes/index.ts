import express, { Request, Response } from 'express';
import budgetRouter from './api-budget';
import billRouter from './api-bill';
import shoppingRouter from './api-shopping';
import { login, register } from '../services/auth';
import { logger } from '../utils/logger';
import { UnauthorizedError, ValidationError } from '../types/errors';

const router = express.Router();

router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const response = await login(email, password);
    res.json(response);
  } catch (error) {
    logger.error('Login error', { error, email: req.body.email });
    res.status(error instanceof UnauthorizedError ? 401 : 500).json({
      success: false,
      error: error instanceof UnauthorizedError ? error.message : 'Internal server error',
    });
  }
});

router.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const { display_name, email, password } = req.body;
    const response = await register(display_name, email, password);
    res.json(response);
  } catch (error) {
    logger.error('Registration error', { error, email: req.body.email });
    res.status(error instanceof ValidationError ? 400 : 500).json({
      success: false,
      error: error instanceof ValidationError ? error.message : 'Internal server error',
    });
  }
});

router.use('/budget', budgetRouter);
router.use('/bill', billRouter);
router.use('/shopping', shoppingRouter);

export default router;
