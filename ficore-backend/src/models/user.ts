import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';

// 1. Define the User interface, extending Mongoose's Document
export interface User extends Document {
  display_name: string;
  email: string;
  password?: string; // Password is optional here as it may not be returned from queries
  ficore_credit_balance: number;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema({
  display_name: {
    type: String,
    required: [true, 'Display name is required'],
    trim: true,
    maxlength: [50, 'Display name cannot exceed 50 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
  },
  ficore_credit_balance: {
    type: Number,
    default: 100, // Starting balance for demo
    min: [0, 'Credit balance cannot be negative'],
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
}, {
  timestamps: true,
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  const user = this;
  if (user.isModified('password')) {
    try {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(user.password, salt);
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// 2. Export both the User interface and the UserModel
export const UserModel = mongoose.model<User>('User', UserSchema);
