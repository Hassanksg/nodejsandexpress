import { Request, Response } from 'express';
import { BillModel } from '../models/bill';
import { deductFicoreCredits } from '../services/credit';
import { cleanCurrency, formatCurrency, formatDate } from '../utils/helpers';
import { ValidationError, NotFoundError, InsufficientCreditsError } from '../types/errors';
import { logger } from '../utils/logger';
import { createBillPDF } from '../services/pdf';
import mongoose from 'mongoose';

export async function createBill(req: Request, res: Response) {
  try {
    const { name, amount, due_date, frequency, category, reminder_days, notes } = req.body;
    const userId = req.user!.id;

    const requiredFields = { name, amount, due_date, frequency, category, reminder_days };
    for (const [key, value] of Object.entries(requiredFields)) {
      if (value === undefined || value === null || value === '') {
        throw new ValidationError(`${key} is required`);
      }
    }

    const billData = {
      user_id: userId,
      name: name?.substring(0, 50),
      amount: cleanCurrency(amount),
      due_date: new Date(due_date),
      frequency,
      category,
      reminder_days: Number(reminder_days) || 0,
      notes: notes?.substring(0, 500) || '',
      status: 'pending',
      created_at: new Date(),
      session_id: req.headers['x-session-id'] || '',
    };

    const bill = await BillModel.create([billData]);
    await deductFicoreCredits(userId, 1, 'create_bill', bill[0]._id.toString());

    return res.json({ success: true, bill: bill[0] });
  } catch (error: any) {
    logger.error('Error creating bill', { error, userId: req.user!.id });
    return res.status(error instanceof ValidationError ? 400 : error instanceof InsufficientCreditsError ? 402 : 500)
      .json({ success: false, error: error.message });
  }
}

export async function getBillDashboard(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

    const bills = await BillModel.find({ user_id: userId })
      .sort({ due_date: 1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const totalBills = await BillModel.countDocuments({ user_id: userId });
    const totalPending = await BillModel.countDocuments({ user_id: userId, status: 'pending' });
    const totalPaid = await BillModel.countDocuments({ user_id: userId, status: 'paid' });
    const totalOverdue = await BillModel.countDocuments({ user_id: userId, status: 'overdue' });

    const categories = await BillModel.aggregate([
      { $match: { user_id: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $project: { label: '$_id', value: '$total', _id: 0 } },
    ]);

    const insights = [];
    if (totalOverdue > 0) insights.push('You have overdue bills. Consider addressing them promptly.');
    if (totalPending > totalPaid) insights.push('Most of your bills are pending. Schedule payments to avoid late fees.');

    return res.json({
      success: true,
      bills,
      summary: {
        total_bills: totalBills,
        pending: totalPending,
        paid: totalPaid,
        overdue: totalOverdue,
      },
      categories,
      insights,
      tips: [
        'Set reminders for due dates.',
        'Pay high-priority bills first.',
        'Review recurring bills for savings.',
      ],
      pagination: {
        page,
        limit,
        total: totalBills,
        pages: Math.ceil(totalBills / limit),
      },
    });
  } catch (error: any) {
    logger.error('Error fetching bill dashboard', { error, userId: req.user!.id });
    return res.status(500).json({ success: false, error: error.message });
  }
}

export async function toggleBillStatus(req: Request, res: Response) {
  try {
    const { bill_id, status } = req.body;
    const userId = req.user!.id;

    if (!bill_id || !['pending', 'paid', 'overdue'].includes(status)) {
      throw new ValidationError('Invalid bill ID or status');
    }

    const bill = await BillModel.findOne({ _id: bill_id, user_id: userId });
    if (!bill) {
      throw new NotFoundError('Bill not found');
    }

    bill.status = status;
    await bill.save();
    await deductFicoreCredits(userId, 1, 'toggle_bill_status', bill_id);

    return res.json({ success: true, bill });
  } catch (error: any) {
    logger.error('Error toggling bill status', { error, userId: req.user!.id });
    return res.status(error instanceof ValidationError ? 400 : error instanceof NotFoundError ? 404 : error instanceof InsufficientCreditsError ? 402 : 500)
      .json({ success: false, error: error.message });
  }
}

export async function deleteBill(req: Request, res: Response) {
  try {
    const { bill_id } = req.body;
    const userId = req.user!.id;

    if (!bill_id) {
      throw new ValidationError('Bill ID is required');
    }

    const result = await BillModel.deleteOne({ _id: bill_id, user_id: userId });
    if (result.deletedCount === 0) {
      throw new NotFoundError('Bill not found');
    }

    await deductFicoreCredits(userId, 1, 'delete_bill', bill_id);

    return res.json({ success: true, message: 'Bill deleted successfully' });
  } catch (error: any) {
    logger.error('Error deleting bill', { error, userId: req.user!.id });
    return res.status(error instanceof ValidationError ? 400 : error instanceof NotFoundError ? 404 : error instanceof InsufficientCreditsError ? 402 : 500)
      .json({ success: false, error: error.message });
  }
}

export async function exportBillPDF(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const exportType = req.params.exportType;
    const billId = req.params.billId;

    if (exportType !== 'single' && exportType !== 'history') {
      throw new ValidationError('Invalid export type');
    }

    if (exportType === 'single' && !billId) {
      throw new ValidationError('Bill ID required');
    }

    const bills = exportType === 'single'
      ? [await BillModel.findOne({ _id: billId, user_id: userId })]
      : await BillModel.find({ user_id: userId }).limit(100);

    if (exportType === 'single' && !bills[0]) {
      throw new NotFoundError('Bill not found');
    }

    const creditCost = exportType === 'single' ? 1 : 2;
    await deductFicoreCredits(userId, creditCost, `export_bill_pdf_${exportType}`, billId || null);

    const pdfBuffer = await createBillPDF(bills, userId, exportType === 'history' ? 'multiple' : 'single');
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=bill_${exportType}_${new Date().toISOString().split('T')[0]}.pdf`,
    });
    return res.send(pdfBuffer);
  } catch (error: any) {
    logger.error('Error exporting bill PDF', { error, userId: req.user!.id });
    return res.status(error instanceof ValidationError ? 400 : error instanceof NotFoundError ? 404 : error instanceof InsufficientCreditsError ? 402 : 500)
      .json({ success: false, error: error.message });
  }
}
