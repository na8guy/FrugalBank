import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 8,
    select: false
  },
  personalDetails: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    phone: { type: String, required: true },
    address: {
      line1: String,
      line2: String,
      city: String,
      postcode: String,
      country: { type: String, default: 'GB' }
    }
  },
  subscription: {
    tier: {
      type: String,
      enum: ['basic', 'plus', 'pro'],
      default: 'basic'
    },
    startDate: Date,
    renewalDate: Date,
    status: {
      type: String,
      enum: ['active', 'cancelled', 'expired'],
      default: 'active'
    }
  },
  modulrAccounts: {
    customerId: String,
    primaryAccountId: String,
    accounts: [{
      accountId: String,
      accountName: String,
      sortCode: String,
      accountNumber: String,
      balance: { type: Number, default: 0 },
      currency: { type: String, default: 'GBP' },
      status: { type: String, default: 'active' }
    }]
  },
  financialSettings: {
    roundUpEnabled: { type: Boolean, default: false },
    autoSaveAmount: Number,
    autoSaveFrequency: {
      type: String,
      enum: ['weekly', 'fortnightly', 'monthly']
    }
  },
  stats: {
    totalSaved: { type: Number, default: 0 },
    goalsCompleted: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 }
  },
  isVerified: { type: Boolean, default: false },
  lastLogin: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ 'modulrAccounts.customerId': 1 });

// Password hashing middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Password comparison method
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Update timestamp middleware
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('User', userSchema);