import express, { Request, Response } from 'express';
import { jwtRequired } from '../services/auth';
import { createBill, getBillDashboard, toggleBillStatus, deleteBill, exportBillPDF } from '../controllers/bill';
import { UserDocument } from '../models/user';

const router = express.Router();

router.post('/new', jwtRequired, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as UserDocument)._id;
    const bill = await createBill(userId, req.body);
    res.json({ success: true, data: bill });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/dashboard', jwtRequired, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as UserDocument)._id;
    const dashboardData = await getBillDashboard(userId);
    res.json({ success: true, data: dashboardData });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/manage', jwtRequired, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as UserDocument)._id;
    const dashboardData = await getBillDashboard(userId);
    res.json({ success: true, data: dashboardData });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/toggle', jwtRequired, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as UserDocument)._id;
    const { bill_id } = req.body;
    const bill = await toggleBillStatus(userId, bill_id);
    res.json({ success: true, data: bill });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/delete', jwtRequired, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as UserDocument)._id;
    const { bill_id } = req.body;
    const result = await deleteBill(userId, bill_id);
    res.json({ success: true, message: result.message });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/export_pdf/:exportType/:billId?', jwtRequired, async (req: Request, res: Response) => {
  try {
    const userId = (req.user as UserDocument)._id;
    const { exportType, billId } = req.params;
    const pdfBuffer = await exportBillPDF(userId, exportType, billId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=bill_report.pdf');
    res.send(pdfBuffer);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
