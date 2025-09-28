import mongoose from 'mongoose';

const savingsGoalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Goal name is required'],
    trim: true,
    maxlength: 100
  },
  targetAmount: {
    type: Number,
    required: [true, 'Target amount is required'],
    min: [1, 'Target amount must be greater than 0']
  },
  currentAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  category: {
    type: String,
    enum: ['holiday', 'emergency', 'deposit', 'education', 'vehicle', 'wedding', 'other'],
    required: true
  },
  timeframe: {
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, required: true },
    durationMonths: Number
  },
  contributionSettings: {
    frequency: {
      type: String,
      enum: ['weekly', 'fortnightly', 'monthly', 'custom'],
      required: true
    },
    amount: { type: Number, required: true },
    nextContributionDate: Date
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled', 'paused'],
    default: 'active'
  },
  modulrAccountId: {
    type: String,
    required: true
  },
  restrictions: {
    earlyWithdrawalFee: { type: Number, default: 0.03 },
    allowedWithdrawalDate: Date,
    withdrawalPenalty: { type: Number, default: 0 }
  },
  progress: {
    percentage: { type: Number, default: 0 },
    daysRemaining: Number,
    monthlyTarget: Number
  },
  achievements: [{
    type: String,
    enum: ['25_percent', '50_percent', '75_percent', 'on_track', 'ahead_of_schedule']
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

savingsGoalSchema.index({ userId: 1, status: 1 });
savingsGoalSchema.index({ endDate: 1 });
savingsGoalSchema.index({ category: 1 });

savingsGoalSchema.virtual('isLocked').get(function() {
  return new Date() < this.restrictions.allowedWithdrawalDate;
});

savingsGoalSchema.virtual('daysUntilWithdrawal').get(function() {
  const now = new Date();
  const withdrawalDate = this.restrictions.allowedWithdrawalDate;
  return Math.ceil((withdrawalDate - now) / (1000 * 60 * 60 * 24));
});

savingsGoalSchema.pre('save', function(next) {
  this.progress.percentage = (this.currentAmount / this.targetAmount) * 100;
  
  const now = new Date();
  const timeRemaining = this.timeframe.endDate - now;
  this.progress.daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));
  
  const monthsRemaining = this.progress.daysRemaining / 30;
  this.progress.monthlyTarget = monthsRemaining > 0 
    ? (this.targetAmount - this.currentAmount) / monthsRemaining 
    : 0;
  
  this.updatedAt = now;
  next();
});

export default mongoose.model('SavingsGoal', savingsGoalSchema);