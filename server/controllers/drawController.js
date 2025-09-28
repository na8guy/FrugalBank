import Draw from '../models/Draw.js';
import UserTask from '../models/UserTask.js';
import User from '../models/User.js';

export const getCurrentDraws = async (req, res) => {
  try {
    const draws = await Draw.find({
      status: { $in: ['upcoming', 'in_progress'] },
      drawDate: { $gte: new Date() }
    }).sort({ drawDate: 1 });

    res.status(200).json({
      status: 'success',
      results: draws.length,
      data: {
        draws
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

export const getDrawEntries = async (req, res) => {
  try {
    const { drawId } = req.params;
    const userId = req.user.id;

    const draw = await Draw.findById(drawId);
    if (!draw) {
      return res.status(404).json({
        status: 'error',
        message: 'Draw not found'
      });
    }

    // Calculate user's entries for this draw
    const userEntries = await UserTask.aggregate([
      {
        $match: {
          userId: userId,
          status: 'approved',
          completedAt: {
            $gte: draw.entryPeriod.start,
            $lte: draw.entryPeriod.end
          }
        }
      },
      {
        $group: {
          _id: null,
          totalEntries: { $sum: '$entryValue' },
          tasksCompleted: { $count: {} }
        }
      }
    ]);

    const entries = userEntries.length > 0 ? userEntries[0].totalEntries : 0;

    res.status(200).json({
      status: 'success',
      data: {
        entries,
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

export const getPastWinners = async (req, res) => {
  try {
    const draws = await Draw.find({
      status: 'completed',
      'winners.0': { $exists: true }
    })
      .populate('winners.userId', 'personalDetails.firstName personalDetails.lastName')
      .sort({ drawDate: -1 })
      .limit(10);

    res.status(200).json({
      status: 'success',
      data: {
        draws
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};