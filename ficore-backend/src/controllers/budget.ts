// controllers/budget.ts
import { Request, Response } from 'express';
import { createBudgetService, getBudgetDashboardService } from '../services/budget';
import { createBudgetPDF } from '../services/pdf';
import { logger } from '../utils/logger';
import { ValidationError, NotFoundError, InsufficientCreditsError } from '../types/errors';
import { BudgetModel } from '../models/budget';
import { deductFicoreCredits } from '../services/credit';

export async function createBudget(req: Request, res: Response) {
  try {
    const budget = await createBudgetService(req.user.id, req.body, req.headers['x-session-id'] as string);
    return res.json({ success: true, budget });
  } catch (error) {
    logger.error('Error creating budget', { error, userId: req.user.id });
    return res.status(error instanceof ValidationError ? 400 : error instanceof InsufficientCreditsError ? 402 : 500)
      .json({ success: false, error: error.message });
  }
}

export async function getDashboard(req: Request, res: Response) {
  try {
    const data = await getBudgetDashboardService(req.user.id, parseInt(req.query.page as string) || 1, Math.min(parseInt(req.query.limit as string) || 10, 50));
    return res.json({ success: true, ...data });
  } catch (error) {
    logger.error('Error fetching budget dashboard', { error, userId: req.user.id });
    return res.status(500).json({ success: false, error: error.message });
  }
}

export async function exportBudgetPDF(req: Request, res: Response) {
  try {
    const userId = req.user.id;
    const exportType = req.params.exportType;
    const budgetId = req.params.budgetId;

    if (exportType !== 'single' && exportType !== 'history') {
      throw new ValidationError('Invalid export type');
    }

    if (exportType === 'single' && !budgetId) {
      throw new ValidationError('Budget ID required');
    }

    const budgets = exportType === 'single'
      ? [await BudgetModel.findOne({ _id: budgetId, user_id: userId })]
      : await BudgetModel.find({ user_id: userId }).limit(100);

    if (exportType === 'single' && !budgets[0]) {
      throw new NotFoundError('Budget not found');
    }

    const creditCost = exportType === 'single' ? 1 : 2;
    await deductFicoreCredits(userId, creditCost, `export_budget_pdf_${exportType}`, budgetId || null);

    const pdfBuffer = await createBudgetPDF(budgets, userId, exportType);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=budget_${exportType}_${new Date().toISOString().split('T')[0]}.pdf`,
    });
    return res.send(pdfBuffer);
  } catch (error) {
    logger.error('Error exporting budget PDF', { error, userId: req.user.id });
    return res.status(error instanceof ValidationError ? 400 : error instanceof NotFoundError ? 404 : error instanceof InsufficientCreditsError ? 402 : 500)
      .json({ success: false, error: error.message });
  }
}