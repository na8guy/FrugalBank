const SavingsGoal = require('../models/SavingsGoal');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const modulrService = require('../services/modulrService');

// @desc    Create a new savings goal
// @route   POST /api/goals
// @access  Private
exports.createGoal = async (req, res) => {
  try {
    const { name, targetAmount, endDate } = req.body;
    const userId = req.user._id;

    // Create a new Modulr account for this goal
    const user = await User.findById(userId);
    let modulrAccount;
    try {
      modulrAccount = await modulrService.createAccount(user.modulrCustomerId);
    } catch (error) {
      return res.status(500).json({ message: 'Error creating goal account' });
    }

    const goal = await SavingsGoal.create({
      userId,
      name,
      targetAmount,
      endDate: new Date(endDate),
      accountId: modulrAccount.id,
    });

    // Update user's accounts array? Maybe not, because we want to keep goal accounts separate.
    // Alternatively, we can store the goal account in the goal model only.

    res.status(201).json(goal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Deposit money into a goal
// @route   POST /api/goals/:id/deposit
// @access  Private
exports.deposit = async (req, res) => {
  try {
    const { amount } = req.body;
    const goal = await SavingsGoal.findById(req.params.id);

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    // Check if the goal belongs to the user
    if (goal.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Get the user's primary account and the goal's account
    const user = await User.findById(req.user._id);
    const primaryAccount = user.accounts[0]; // Assuming the first account is the primary

    // Transfer money from primary account to goal account using Modulr
    try {
      await modulrService.makeTransfer(primaryAccount.accountId, goal.accountId, amount, `Deposit to goal: ${goal.name}`);
    } catch (error) {
      return res.status(500).json({ message: 'Transfer failed' });
    }

    // Update goal current amount
    goal.currentAmount += amount;
    await goal.save();

    // Record transaction
    await Transaction.create({
      userId: req.user._id,
      savingsGoalId: goal._id,
      type: 'Deposit',
      amount,
      description: `Deposit to ${goal.name}`,
    });

    res.json(goal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Withdraw money from a goal (emergency withdrawal)
// @route   POST /api/goals/:id/withdraw
// @access  Private
exports.withdraw = async (req, res) => {
  try {
    const { amount, isEmergency } = req.body;
    const goal = await SavingsGoal.findById(req.params.id);

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    if (goal.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (goal.currentAmount < amount) {
      return res.status(400).json({ message: 'Insufficient funds' });
    }

    // Calculate fee for emergency withdrawal
    let fee = 0;
    if (isEmergency) {
      // Based on subscription tier
      const user = await User.findById(req.user._id);
      if (user.subscriptionTier === 'Basic') {
        fee = amount * 0.03;
      } else if (user.subscriptionTier === 'Plus') {
        fee = amount * 0.015;
      } else if (user.subscriptionTier === 'Pro') {
        // Pro users have no fee, but we might limit the number of free withdrawals
        fee = 0;
      }
    }

    const netAmount = amount - fee;

    // Transfer money from goal account to primary account
    const user = await User.findById(req.user._id);
    const primaryAccount = user.accounts[0];

    try {
      await modulrService.makeTransfer(goal.accountId, primaryAccount.accountId, netAmount, `Withdrawal from goal: ${goal.name}`);
    } catch (error) {
      return res.status(500).json({ message: 'Transfer failed' });
    }

    // Update goal current amount
    goal.currentAmount -= amount;
    if (goal.currentAmount === 0) {
      goal.status = 'Withdrawn';
    }
    await goal.save();

    // Record transaction for the withdrawal
    await Transaction.create({
      userId: req.user._id,
      savingsGoalId: goal._id,
      type: 'Withdrawal',
      amount: netAmount,
      description: `Withdrawal from ${goal.name}${isEmergency ? ' (Emergency)' : ''}`,
    });

    // If there was a fee, record it as a separate transaction
    if (fee > 0) {
      await Transaction.create({
        userId: req.user._id,
        savingsGoalId: goal._id,
        type: 'Fee',
        amount: fee,
        description: `Emergency withdrawal fee for ${goal.name}`,
      });
    }

    res.json({ goal, netAmount, fee });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};