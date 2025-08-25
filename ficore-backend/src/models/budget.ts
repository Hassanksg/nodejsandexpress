// models/budget.ts
import mongoose, { Schema } from 'mongoose';
import { cleanCurrency } from '../utils/helpers';
import { ValidationError } from '../types/errors';

const BudgetSchema = new Schema({
  user_id: {
    type: String,
    required: [true, 'User ID is required'],
    index: true,
  },
  income: {
    type: Number,
    required: [true, 'Income is required'],
    set: (value: string | number) => {
      const cleaned = cleanCurrency(value);
      if (cleaned === null) throw new ValidationError('Invalid income format');
      return cleaned;
    },
    min: [0, 'Income cannot be negative'],
  },
  housing: {
    type: Number,
    required: [true, 'Housing is required'],
    set: (value: string | number) => {
      const cleaned = cleanCurrency(value);
      if (cleaned === null) throw new ValidationError('Invalid housing format');
      return cleaned;
    },
    min: [0, 'Housing cannot be negative'],
  },
  food: {
    type: Number,
    required: [true, 'Food is required'],
    set: (value: string | number) => {
      const cleaned = cleanCurrency(value);
      if (cleaned === null) throw new ValidationError('Invalid food format');
      return cleaned;
    },
    min: [0, 'Food cannot be negative'],
  },
  transport: {
    type: Number,
    required: [true, 'Transport is required'],
    set: (value: string | number) => {
      const cleaned = cleanCurrency(value);
      if (cleaned === null) throw new ValidationError('Invalid transport format');
      return cleaned;
    },
    min: [0, 'Transport cannot be negative'],
  },
  dependents: {
    type: Number,
    required: [true, 'Dependents is required'],
    min: [0, 'Dependents cannot be negative'],
  },
  miscellaneous: {
    type: Number,
    required: [true, 'Miscellaneous is required'],
    set: (value: string | number) => {
      const cleaned = cleanCurrency(value);
      if (cleaned === null) throw new ValidationError('Invalid miscellaneous format');
      return cleaned;
    },
    min: [0, 'Miscellaneous cannot be negative'],
  },
  others: {
    type: Number,
    required: [true, 'Others is required'],
    set: (value: string | number) => {
      const cleaned = cleanCurrency(value);
      if (cleaned === null) throw new ValidationError('Invalid others format');
      return cleaned;
    },
    min: [0, 'Others cannot be negative'],
  },
  savings_goal: {
    type: Number,
    required: [true, 'Savings goal is required'],
    set: (value: string | number) => {
      const cleaned = cleanCurrency(value);
      if (cleaned === null) throw new ValidationError('Invalid savings goal format');
      return cleaned;
    },
    min: [0, 'Savings goal cannot be negative'],
  },
  fixed_expenses: {
    type: Number,
    default: 0,
  },
  variable_expenses: {
    type: Number,
    default: 0,
  },
  surplus_deficit: {
    type: Number,
    default: 0,
  },
  custom_categories: [{
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      maxlength: [50, 'Category name cannot exceed 50 characters'],
    },
    amount: {
      type: Number,
      required: [true, 'Category amount is required'],
      set: (value: string | number) => {
        const cleaned = cleanCurrency(value);
        if (cleaned === null) throw new ValidationError('Invalid category amount format');
        return cleaned;
      },
      min: [0, 'Category amount cannot be negative'],
    },
  }],
  created_at: {
    type: Date,
    default: Date.now,
  },
  session_id: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

export const BudgetModel = mongoose.model('Budget', BudgetSchema);