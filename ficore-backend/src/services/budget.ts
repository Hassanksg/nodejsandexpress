import { BudgetModel } from '../models/budget';
import { deductFicoreCredits } from './credit';
import { cleanCurrency } from '../utils/helpers';
import { ValidationError, NotFoundError } from '../types/errors';
import { logger } from '../utils/logger';

interface CustomCategory {
  name: string;
  amount: number;
}

interface BudgetData {
  user_id: string;
  income: number;
  housing: number;
  food: number;
  transport: number;
  dependents: number;
  miscellaneous: number;
  others: number;
  savings_goal: number;
  fixed_expenses: number;
  variable_expenses: number;
  custom_categories: CustomCategory[];
  created_at: Date;
  session_id: string;
  surplus_deficit: number;
}

export async function createBudgetService(userId: string, data: any, sessionId: string) {
  const {
    income, housing, food, transport, dependents,
    miscellaneous, others, savings_goal, custom_categories,
  } = data;

  const requiredFields = { income, housing, food, transport, dependents, miscellaneous, others, savings_goal };
  for (const [key, value] of Object.entries(requiredFields)) {
    if (cleanCurrency(value) === null) {
      throw new ValidationError(`${key} is required`);
    }
  }

  const budgetData: Omit<BudgetData, 'surplus_deficit'> = {
    user_id: userId,
    income: cleanCurrency(income)!,
    housing: cleanCurrency(housing)!,
    food: cleanCurrency(food)!,
    transport: cleanCurrency(transport)!,
    dependents: Number(dependents) || 0,
    miscellaneous: cleanCurrency(miscellaneous)!,
    others: cleanCurrency(others)!,
    savings_goal: cleanCurrency(savings_goal)!,
    fixed_expenses: cleanCurrency(housing)! + cleanCurrency(food)! + cleanCurrency(transport)!,
    variable_expenses: cleanCurrency(miscellaneous)! + cleanCurrency(others)!,
    custom_categories: custom_categories?.map((cat: any) => ({
      name: cat.name?.substring(0, 50) || '',
      amount: cleanCurrency(cat.amount) || 0,
    })) || [],
    created_at: new Date(),
    session_id: sessionId || '',
  };

  const finalBudgetData: BudgetData = {
      ...budgetData,
      surplus_deficit: budgetData.income - budgetData.fixed_expenses - budgetData.variable_expenses - budgetData.savings_goal,
  };

  const budget = await BudgetModel.create([finalBudgetData]);
  await deductFicoreCredits(userId, 1, 'create_budget', budget[0]._id.toString());

  return budget[0];
}

export async function getBudgetDashboardService(userId: string, page: number, limit: number) {
  const budgets = await BudgetModel.find({ user_id: userId })
    .sort({ created_at: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const totalBudgets = await BudgetModel.countDocuments({ user_id: userId });
  const latestBudget = budgets[0] || null;

  const categories = latestBudget ? [
    { label: 'Housing', value: latestBudget.housing, color: '#FF6384' },
    { label: 'Food', value: latestBudget.food, color: '#36A2EB' },
    { label: 'Transport', value: latestBudget.transport, color: '#FFCE56' },
    { label: 'Miscellaneous', value: latestBudget.miscellaneous, color: '#4BC0C0' },
    { label: 'Others', value: latestBudget.others, color: '#9966FF' },
    ...latestBudget.custom_categories.map((cat: any) => ({
      label: cat.name,
      value: cat.amount,
      color: '#FF9F40',
    })),
  ] : [];

  const insights = latestBudget && typeof latestBudget.surplus_deficit === 'number'
    ? [latestBudget.surplus_deficit > 0 ? 'You have a budget surplus.' : 'You have a budget deficit.']
    : [];

  return {
    latest_budget: latestBudget,
    budgets,
    categories,
    insights,
    tips: [
      'Track expenses regularly.',
      'Consider ajo savings.',
      'Optimize data subscriptions.',
      'Plan for dependents.',
    ],
    pagination: {
      page,
      limit,
      total: totalBudgets,
      pages: Math.ceil(totalBudgets / limit),
    },
  };
}
