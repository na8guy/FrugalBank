import AdTask from '../models/AdTask.js';
import Draw from '../models/Draw.js';
import User from '../models/User.js';
import SavingsGoal from '../models/SavingsGoal.js';

export const createAdTask = async (req, res) => {
  try {
    const task = await AdTask.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        task
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

export const createDraw = async (req, res) => {
  try {
    const draw = await Draw.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        draw
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalGoals,
      activeGoals,
      completedGoals,
      totalSavings,
      pendingTasks
    ] = await Promise.all([
      User.countDocuments(),
      SavingsGoal.countDocuments(),
      SavingsGoal.countDocuments({ status: 'active' }),
      SavingsGoal.countDocuments({ status: 'completed' }),
      SavingsGoal.aggregate([{ $group: { _id: null, total: { $sum: '$currentAmount' } } }]),
      AdTask.countDocuments({ status: 'active' })
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        stats: {
          totalUsers,
          totalGoals,
          activeGoals,
          completedGoals,
          totalSavings: totalSavings[0]?.total || 0,
          pendingTasks
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};