import SavingsGoal from '../models/SavingsGoal.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import modulrService from '../services/modulrService.js';

export const createGoal = async (req, res) => {
  try {
    const {
      name,
      targetAmount,
      category,
      endDate,
      frequency,
      amount
    } = req.body;

    const user = await User.findById(req.user.id);

    // Create account in Modulr for this goal
    const accountName = `Goal: ${name} - ${user.personalDetails.firstName}`;
    const modulrAccount = await modulrService.createAccount(
      user.modulrAccounts.customerId,
      accountName
    );

    // Calculate withdrawal date (goal end date)
    const withdrawalDate = new Date(endDate);

    const goal = await SavingsGoal.create({
      userId: req.user.id,
      name,
      targetAmount,
      currentAmount: 0,
      category,
      timeframe: {
        startDate: new Date(),
        endDate: withdrawalDate,
        durationMonths: Math.ceil((withdrawalDate - new Date()) / (1000 * 60 * 60 * 24 * 30))
      },
      contributionSettings: {
        frequency,
        amount,
        nextContributionDate: new Date()
      },
      modulrAccountId: modulrAccount.id,
      restrictions: {
        earlyWithdrawalFee: getWithdrawalFee(user.subscription.tier),
        allowedWithdrawalDate: withdrawalDate
      }
    });

    // Update user's accounts list
    user.modulrAccounts.accounts.push({
      accountId: modulrAccount.id,
      accountName: modulrAccount.name,
      sortCode: modulrAccount.sortCode,
      accountNumber: modulrAccount.accountNumber,
      balance: 0
    });
    await user.save();

    res.status(201).json({
      status: 'success',
      data: {
        goal
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

export const getGoals = async (req, res) => {
  try {
    const goals = await SavingsGoal.find({ userId: req.user.id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: goals.length,
      data: {
        goals
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

export const getGoal = async (req, res) => {
  try {
    const goal = await SavingsGoal.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!goal) {
      return res.status(404).json({
        status: 'error',
        message: 'Goal not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        goal
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

export const makeContribution = async (req, res) => {
  try {
    const { amount, sourceAccountId } = req.body;
    const goalId = req.params.id;

    const goal = await SavingsGoal.findOne({
      _id: goalId,
      userId: req.user.id
    });

    if (!goal) {
      return res.status(404).json({
        status: 'error',
        message: 'Goal not found'
      });
    }

    const user = await User.findById(req.user.id);

    // Process payment through Modulr
    const payment = await modulrService.initiatePayment(
      sourceAccountId,
      goal.modulrAccountId,
      amount,
      `Contribution to ${goal.name}`
    );

    // Update goal amount
    goal.currentAmount += amount;
    await goal.save();

    // Create transaction record
    const transaction = await Transaction.create({
      userId: req.user.id,
      goalId: goal._id,
      type: 'contribution',
      amount,
      status: 'completed',
      reference: payment.id,
      metadata: {
        paymentId: payment.id,
        sourceAccount: sourceAccountId,
        destinationAccount: goal.modulrAccountId
      }
    });

    // Update user stats
    user.stats.totalSaved += amount;
    await user.save();

    res.status(200).json({
      status: 'success',
      data: {
        goal,
        transaction
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

export const requestWithdrawal = async (req, res) => {
  try {
    const { amount, reason, isEmergency } = req.body;
    const goalId = req.params.id;

    const goal = await SavingsGoal.findOne({
      _id: goalId,
      userId: req.user.id
    });

    if (!goal) {
      return res.status(404).json({
        status: 'error',
        message: 'Goal not found'
      });
    }

    if (amount > goal.currentAmount) {
      return res.status(400).json({
        status: 'error',
        message: 'Insufficient funds in goal'
      });
    }

    const user = await User.findById(req.user.id);

    if (isEmergency && goal.isLocked) {
      const fee = amount * goal.restrictions.earlyWithdrawalFee;
      const netAmount = amount - fee;

      // Process withdrawal with fee
      const payment = await modulrService.initiatePayment(
        goal.modulrAccountId,
        user.modulrAccounts.primaryAccountId,
        netAmount,
        `Emergency withdrawal from ${goal.name}`
      );

      // Update goal amount
      goal.currentAmount -= amount;
      await goal.save();

      // Create transaction records
      await Transaction.create([
        {
          userId: req.user.id,
          goalId: goal._id,
          type: 'withdrawal',
          amount: netAmount,
          status: 'completed',
          reference: payment.id
        },
        {
          userId: req.user.id,
          goalId: goal._id,
          type: 'fee',
          amount: fee,
          status: 'completed',
          reference: `FEE-${payment.id}`,
          description: 'Early withdrawal fee'
        }
      ]);

    } else if (!goal.isLocked) {
      // Normal withdrawal
      const payment = await modulrService.initiatePayment(
        goal.modulrAccountId,
        user.modulrAccounts.primaryAccountId,
        amount,
        `Withdrawal from ${goal.name}`
      );

      goal.currentAmount -= amount;
      await goal.save();

      await Transaction.create({
        userId: req.user.id,
        goalId: goal._id,
        type: 'withdrawal',
        amount,
        status: 'completed',
        reference: payment.id
      });
    } else {
      return res.status(400).json({
        status: 'error',
        message: 'Goal is still locked. Use emergency withdrawal for early access.'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Withdrawal processed successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

function getWithdrawalFee(tier) {
  const fees = {
    'basic': 0.03,
    'plus': 0.015,
    'pro': 0
  };
  return fees[tier] || 0.03;
}