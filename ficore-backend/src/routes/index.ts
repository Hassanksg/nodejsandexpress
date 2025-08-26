// ficore-backend/src/routes/index.ts
import express, { Request, Response } from 'express';
import budgetRouter from './api-budget';
import billRouter from './api-bill';
import shoppingRouter from './api-shopping';
import { login, register, jwtRequired } from '../services/auth';
import { logger } from '../utils/logger';
import { UnauthorizedError, ValidationError } from '../types/errors';

const router = express.Router();

router.post('/auth/login', jwtRequired, async (req: Request, res: Response) => {
  // Now you can access req.user
});

router.post('/auth/register', jwtRequired, async (req: Request, res: Response) => {
  // Now you can access req.user
});

router.use('/budget', budgetRouter);
router.use('/bill', billRouter);
router.use('/shopping', shoppingRouter);

export default router;
