// models/audit.ts
import mongoose, { Schema } from 'mongoose';

const FicoreCreditTransactionSchema = new Schema({
  user_id: {
    type: String,
    required: [true, 'User ID is required'],
    index: true,
  },
  action: {
    type: String,
    required: [true, 'Action is required'],
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
  },
  item_id: {
    type: String,
    default: null,
  },
  timestamp: {
    type: Date,
    required: [true, 'Timestamp is required'],
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['completed', 'failed'],
    required: [true, 'Status is required'],
  },
}, {
  timestamps: true,
});

export const FicoreCreditTransactionModel = mongoose.model('FicoreCreditTransaction', FicoreCreditTransactionSchema);