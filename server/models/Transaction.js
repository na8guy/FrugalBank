const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  savingsGoalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SavingsGoal',
  },
  type: {
    type: String,
    enum: ['Deposit', 'Withdrawal', 'Prize', 'Fee'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  description: String,
  date: {
    type: Date,
    default: Date.now,
  },
  // For withdrawals, track if it was an emergency withdrawal
  isEmergencyWithdrawal: {
    type: Boolean,
    default: false,
  },
  // Modulr transaction ID for reference
  modulrTransactionId: String,
});

module.exports = mongoose.model('Transaction', transactionSchema);