import express, { Request, Response } from 'express';
import { jwtRequired } from '../services/auth';
import { createBudget, getDashboard, exportBudgetPDF } from '../controllers/budget';
import { BudgetModel } from '../models/budget';
import { NotFoundError } from '../types/errors';
import { deductFicoreCredits } from '../services/credit';
import { UserDocument } from '../models/user';

const router = express.Router();

router.post('/new', jwtRequired, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as UserDocument)._id;
    const budget = await createBudget(userId, req.body);
    res.json({ success: true, data: budget });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/dashboard', jwtRequired, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as UserDocument)._id;
    const dashboardData = await getDashboard(userId, req.query);
    res.json({ success: true, data: dashboardData });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/manage', jwtRequired, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as UserDocument)._id;
    const dashboardData = await getDashboard(userId, req.query);
    res.json({ success: true, data: dashboardData });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/delete', jwtRequired, async (req: Request, res: Response) => {
  try {
    const { budget_id } = req.body;
    if (!budget_id) {
      return res.status(400).json({ success: false, error: 'Budget ID is required' });
    }
    const userId = (req.user as UserDocument)._id;
    const result = await BudgetModel.deleteOne({ _id: budget_id, user_id: userId });
    if (result.deletedCount === 0) {
      throw new NotFoundError('Budget not found');
    }
    await deductFicoreCredits(userId, 1, 'delete_budget', budget_id);
    res.json({ success: true, message: 'Budget deleted successfully' });
  } catch (error: any) {
    res.status(error instanceof NotFoundError ? 404 : 500).json({ success: false, error: error.message });
  }
});

router.get('/export_pdf/:exportType/:budgetId?', jwtRequired, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as UserDocument)._id;
    const { exportType, budgetId } = req.params;
    const pdfBuffer = await exportBudgetPDF(userId, exportType, budgetId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=budget_report.pdf');
    res.send(pdfBuffer);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
