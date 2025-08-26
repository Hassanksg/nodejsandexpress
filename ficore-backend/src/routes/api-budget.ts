import express, { Request, Response } from 'express';
import { jwtRequired } from '../services/auth';
import { createBudget, getDashboard, exportBudgetPDF } from '../controllers/budget';
import { BudgetModel } from '../models/budget';
import { NotFoundError } from '../types/errors';
import { deductFicoreCredits } from '../services/ficore';


const router = express.Router();

router.post('/new', jwtRequired, createBudget);
router.get('/dashboard', jwtRequired, getDashboard);
router.get('/manage', jwtRequired, getDashboard);
router.post('/delete', jwtRequired, async (req: Request, res: Response) => {
  try {
    const budgetId = req.body.budget_id;
    const userId = req.user!.id; // Use non-null assertion since middleware ensures it exists
    const result = await BudgetModel.deleteOne({ _id: budgetId, user_id: userId });
    if (result.deletedCount === 0) {
      throw new NotFoundError('Budget not found');
    }
    await deductFicoreCredits(userId, 1, 'delete_budget', budgetId);
    res.json({ success: true, message: 'Budget deleted successfully' });
  } catch (error: any) {
    res.status(error instanceof NotFoundError ? 404 : 500).json({ success: false, error: error.message });
  }
});
router.get('/export_pdf/:exportType/:budgetId?', jwtRequired, exportBudgetPDF);

export default router;
