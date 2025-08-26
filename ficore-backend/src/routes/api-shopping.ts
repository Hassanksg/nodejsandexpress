import express, { Request, Response } from 'express';
import { jwtRequired } from '../services/auth';
import { createShoppingList, addShoppingItem, getShoppingDashboard, toggleShoppingItem, deleteShoppingList, deleteShoppingItem, exportShoppingPDF } from '../controllers/shopping';
import { UserDocument } from '../models/user';

const router = express.Router();

router.post('/new_list', jwtRequired, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as UserDocument)._id;
    const shoppingList = await createShoppingList(userId, req.body);
    res.json({ success: true, data: shoppingList });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/new_item', jwtRequired, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as UserDocument)._id;
    const shoppingItem = await addShoppingItem(userId, req.body);
    res.json({ success: true, data: shoppingItem });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/dashboard', jwtRequired, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as UserDocument)._id;
    const dashboardData = await getShoppingDashboard(userId);
    res.json({ success: true, data: dashboardData });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/manage', jwtRequired, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as UserDocument)._id;
    const dashboardData = await getShoppingDashboard(userId);
    res.json({ success: true, data: dashboardData });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/toggle_item', jwtRequired, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as UserDocument)._id;
    const { itemId } = req.body;
    const item = await toggleShoppingItem(userId, itemId);
    res.json({ success: true, data: item });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/delete_list', jwtRequired, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as UserDocument)._id;
    const { listId } = req.body;
    const result = await deleteShoppingList(userId, listId);
    res.json({ success: true, message: result.message });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/delete_item', jwtRequired, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as UserDocument)._id;
    const { itemId } = req.body;
    const result = await deleteShoppingItem(userId, itemId);
    res.json({ success: true, message: result.message });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/export_pdf/:exportType/:listId?', jwtRequired, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as UserDocument)._id;
    const { exportType, listId } = req.params;
    const pdfBuffer = await exportShoppingPDF(userId, exportType, listId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=shopping_report.pdf');
    res.send(pdfBuffer);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
