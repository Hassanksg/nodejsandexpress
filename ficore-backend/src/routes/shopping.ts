import mongoose, { Schema } from 'mongoose';
import { cleanCurrency } from '../utils/helpers';
import { ValidationError } from '../types/errors';

// Define valid categories for shopping items
const SHOPPING_CATEGORIES = ['Food', 'Utilities', 'Household', 'Electronics', 'Clothing', 'Healthcare', 'Education', 'Entertainment', 'Miscellaneous'] as const;

const ShoppingItemSchema = new Schema({
  name: { 
    type: String, 
    required: [true, 'Item name is required'], 
    trim: true, 
    maxlength: [50, 'Item name cannot exceed 50 characters'] 
  },
  estimated_cost: { 
    type: Number, 
    required: [true, 'Estimated cost is required'],
    set: (value: string | number) => {
      const cleaned = cleanCurrency(value);
      if (cleaned === null) throw new ValidationError('Invalid estimated cost format');
      return cleaned;
    },
    min: [0, 'Estimated cost cannot be negative'],
    max: [1000000000, 'Estimated cost cannot exceed 1 billion']
  },
  category: { 
    type: String, 
    required: [true, 'Category is required'],
    enum: {
      values: SHOPPING_CATEGORIES,
      message: 'Invalid category. Must be one of: {VALUE}'
    },
    default: 'Miscellaneous'
  },
  quantity: { 
    type: Number, 
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'],
    max: [1000, 'Quantity cannot exceed 1000']
  },
  is_purchased: { 
    type: Boolean, 
    default: false 
  }
});

// Auto-categorize items based on name patterns
ShoppingItemSchema.pre('validate', function (next) {
  const item = this as any;
  if (!item.category || item.category === 'Miscellaneous') {
    item.category = autoCategorizeItem(item.name);
  }
  next();
});

const ShoppingListSchema = new Schema({
  user_id: { 
    type: String, 
    required: [true, 'User ID is required'], 
    index: true 
  },
  list_name: { 
    type: String, 
    required: [true, 'List name is required'], 
    trim: true, 
    maxlength: [50, 'List name cannot exceed 50 characters'] 
  },
  items: [ShoppingItemSchema],
  budget: { 
    type: Number, 
    set: (value: string | number) => {
      const cleaned = cleanCurrency(value);
      if (cleaned === null) throw new ValidationError('Invalid budget format');
      return cleaned;
    },
    min: [0, 'Budget cannot be negative'],
    max: [1000000000, 'Budget cannot exceed 1 billion'],
    default: 0
  },
  total_estimated_cost: { 
    type: Number, 
    default: 0 
  },
  created_at: { 
    type: Date, 
    default: Date.now 
  },
  session_id: { 
    type: String, 
    default: '' 
  }
}, {
  timestamps: true
});

// Compute total_estimated_cost before saving
ShoppingListSchema.pre('save', function (next) {
  const list = this as any;
  list.total_estimated_cost = list.items.reduce((sum: number, item: any) => 
    sum + (item.estimated_cost * item.quantity), 0);
  next();
});

function autoCategorizeItem(itemName: string): string {
  const name = itemName.toLowerCase().trim();
  
  if (/milk|bread|egg|meat|fish|vegetable|fruit|cereal|rice|pasta/.test(name)) {
    return 'Food';
  }
  if (/detergent|soap|cleaner|sponge|trash bag|paper towel/.test(name)) {
    return 'Household';
  }
  if (/phone|laptop|charger|cable|headphones/.test(name)) {
    return 'Electronics';
  }
  if (/shirt|pants|shoes|jacket|dress|socks/.test(name)) {
    return 'Clothing';
  }
  if (/medicine|bandage|thermometer|vitamins/.test(name)) {
    return 'Healthcare';
  }
  if (/book|notebook|pen|pencil|stationery/.test(name)) {
    return 'Education';
  }
  if (/ticket|dvd|game|concert|movie/.test(name)) {
    return 'Entertainment';
  }
  if (/electricity|water|gas|internet|phone bill/.test(name)) {
    return 'Utilities';
  }
  return 'Miscellaneous';
}

export const ShoppingListModel = mongoose.model('ShoppingList', ShoppingListSchema);