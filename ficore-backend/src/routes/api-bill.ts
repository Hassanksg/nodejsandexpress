import express, { Request, Response } from 'express';
import { jwtRequired } from '../services/auth';
import { createBill, getBillDashboard, toggleBillStatus, deleteBill, exportBillPDF } from '../controllers/bill';

const router = express.Router();

router.post('/new', jwtRequired, createBill);
router.get('/dashboard', jwtRequired, getBillDashboard);
router.get('/manage', jwtRequired, getBillDashboard);
router.post('/toggle', jwtRequired, toggleBillStatus);
router.post('/delete', jwtRequired, deleteBill);
router.get('/export_pdf/:exportType/:billId?', jwtRequired, exportBillPDF);

export default router;
