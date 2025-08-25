// services/bill.ts
import { BillModel } from '../models/bill';
import { deductFicoreCredits } from './credit';
import { cleanCurrency, formatCurrency, formatDate } from '../utils/helpers';
import { ValidationError, NotFoundError } from '../types/errors';
import { logger } from '../utils/logger';

export async function createBillService(userId: string, data: any, sessionId: string) {
  const { name, amount, due_date, frequency, category, reminder_days, notes } = data;

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
    session_id: sessionId || '',
  };

  const bill = await BillModel.create([billData]);
  await deductFicoreCredits(userId, 1, 'create_bill', bill[0]._id.toString());

  return bill[0];
}

export async function getBillDashboardService(userId: string, page: number, limit: number) {
  const bills = await BillModel.find({ user_id: userId })
    .sort({ due_date: 1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const totalBills = await BillModel.countDocuments({ user_id: userId });
  const totalPending = await BillModel.countDocuments({ user_id: userId, status: 'pending' });
  const totalPaid = await BillModel.countDocuments({ user_id: userId, status: 'paid' });
  const totalOverdue = await BillModel.countDocuments({ user_id: userId, status: 'overdue' });

  const categories = await BillModel.aggregate([
    { $match: { user_id: userId } },
    { $group: { _id: '$category', total: { $sum: '$amount' } } },
    { $project: { label: '$_id', value: '$total', _id: 0 } },
  ]);

  const insights = [];
  if (totalOverdue > 0) insights.push('You have overdue bills. Consider addressing them promptly.');
  if (totalPending > totalPaid) insights.push('Most of your bills are pending. Schedule payments to avoid late fees.');

  return {
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
  };
}