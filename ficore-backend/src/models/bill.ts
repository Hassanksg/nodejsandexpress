import mongoose, { Schema } from 'mongoose';
import { cleanCurrency } from '../utils/helpers';
import { ValidationError } from '../types/errors';

// Define valid options for frequency and category
const BILL_FREQUENCIES = ['one-time', 'weekly', 'monthly', 'quarterly'] as const;
const BILL_CATEGORIES = ['Utilities', 'Rent', 'Food', 'Transport', 'Insurance', 'Healthcare', 'Education', 'Entertainment', 'Miscellaneous'] as const;
const BILL_STATUSES = ['pending', 'paid', 'overdue'] as const;

const BillSchema = new Schema({
  user_id: { 
    type: String, 
    required: [true, 'User ID is required'], 
    index: true 
  },
  name: { 
    type: String, 
    required: [true, 'Bill name is required'], 
    trim: true, 
    maxlength: [50, 'Bill name cannot exceed 50 characters'] 
  },
  amount: { 
    type: Number, 
    required: [true, 'Amount is required'],
    set: (value: string | number) => {
      const cleaned = cleanCurrency(value);
      if (cleaned === null) throw new ValidationError('Invalid amount format');
      return cleaned;
    },
    min: [0, 'Amount cannot be negative'],
    max: [10000000000, 'Amount cannot exceed 10 billion']
  },
  due_date: { 
    type: Date, 
    required: [true, 'Due date is required'],
    validate: {
      validator: (value: Date) => value >= new Date(new Date().setHours(0, 0, 0, 0)),
      message: 'Due date cannot be in the past'
    }
  },
  frequency: { 
    type: String, 
    required: [true, 'Frequency is required'],
    enum: {
      values: BILL_FREQUENCIES,
      message: 'Invalid frequency. Must be one of: {VALUE}'
    }
  },
  category: { 
    type: String, 
    required: [true, 'Category is required'],
    enum: {
      values: BILL_CATEGORIES,
      message: 'Invalid category. Must be one of: {VALUE}'
    }
  },
  status: { 
    type: String, 
    required: [true, 'Status is required'],
    enum: {
      values: BILL_STATUSES,
      message: 'Invalid status. Must be one of: {VALUE}'
    },
    default: 'pending'
  },
  reminder_days: { 
    type: Number, 
    required: [true, 'Reminder days is required'],
    min: [0, 'Reminder days cannot be negative'],
    max: [30, 'Reminder days cannot exceed 30 days']
  },
  created_at: { 
    type: Date, 
    default: Date.now 
  },
  session_id: { 
    type: String, 
    default: '' 
  },
  notes: { 
    type: String, 
    trim: true, 
    maxlength: [500, 'Notes cannot exceed 500 characters'], 
    default: '' 
  }
}, {
  timestamps: true
});

export const BillModel = mongoose.model('Bill', BillSchema);