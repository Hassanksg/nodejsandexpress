// types/index.ts
export interface BudgetForm {
  income: string | number;
  housing: string | number;
  food: string | number;
  transport: string | number;
  dependents: number;
  miscellaneous: string | number;
  others: string | number;
  savings_goal: string | number;
  custom_categories?: { name: string; amount: string | number }[];
}

export interface BillData {
  name: string;
  amount: string | number;
  due_date: string | Date;
  frequency: string;
  category: string;
  reminder_days: number;
  notes?: string;
}

export interface ShoppingListData {
  list_name: string;
  budget: string | number;
  items: { name: string; estimated_cost: string | number; quantity: number; category?: string }[];
}

export interface User {
  id: string;
  display_name: string;
  email: string;
  ficore_credit_balance: number;
  role: string;
}