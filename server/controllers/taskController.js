import AdTask from '../models/AdTask.js';
import UserTask from '../models/UserTask.js';
import User from '../models/User.js';

export const getAvailableTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get tasks that are active and user hasn't completed
    const completedTaskIds = await UserTask.find({
      userId,
      status: { $in: ['completed', 'approved'] }
    }).distinct('taskId');

    const tasks = await AdTask.find({
      status: 'active',
      _id: { $nin: completedTaskIds },
      'schedule.startDate': { $lte: new Date() },
      'schedule.endDate': { $gte: new Date() }
    });

    res.status(200).json({
      status: 'success',
      results: tasks.length,
      data: {
        tasks
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

export const startTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;

    const task = await AdTask.findById(taskId);
    if (!task || task.status !== 'active') {
      return res.status(404).json({
        status: 'error',
        message: 'Task not available'
      });
    }

    // Check if user already started this task
    let userTask = await UserTask.findOne({
      userId,
      taskId
    });

    if (!userTask) {
      userTask = await UserTask.create({
        userId,
        taskId,
        status: 'in_progress',
        startedAt: new Date()
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        task,
        userTask
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

export const submitTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { answers, timeSpent } = req.body;
    const userId = req.user.id;

    const userTask = await UserTask.findOne({
      userId,
      taskId
    });

    if (!userTask) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found'
      });
    }

    const task = await AdTask.findById(taskId);

    // Validate answers meet minimum requirements
    const isValid = validateTaskCompletion(answers, task.requirements);
    
    if (!isValid) {
      return res.status(400).json({
        status: 'error',
        message: 'Task completion does not meet requirements'
      });
    }

    // Update user task
    userTask.answers = answers;
    userTask.timeSpent = timeSpent;
    userTask.status = 'completed';
    userTask.completedAt = new Date();
    userTask.entryValue = task.reward.entries;
    
    await userTask.save();

    // Update task analytics
    task.analytics.completions += 1;
    task.analytics.avgCompletionTime = 
      ((task.analytics.avgCompletionTime || 0) * (task.analytics.completions - 1) + timeSpent) / task.analytics.completions;
    await task.save();

    res.status(200).json({
      status: 'success',
      data: {
        userTask,
        entriesEarned: task.reward.entries
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

export const getUserTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const userTasks = await UserTask.find({ userId })
      .populate('taskId')
      .sort({ completedAt: -1 });

    res.status(200).json({
      status: 'success',
      results: userTasks.length,
      data: {
        tasks: userTasks
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

function validateTaskCompletion(answers, requirements) {
  // Basic validation - in real implementation, this would be more sophisticated
  if (requirements.minTimeMinutes) {
    const totalTime = answers.reduce((sum, answer) => sum + (answer.timeSpent || 0), 0);
    if (totalTime < requirements.minTimeMinutes) {
      return false;
    }
  }

  // Check if all required questions are answered
  const requiredQuestions = answers.filter(answer => answer.required);
  if (requiredQuestions.some(q => !q.answer || q.answer.trim() === '')) {
    return false;
  }

  return true;
}