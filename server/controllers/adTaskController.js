const AdTask = require('../models/AdTask');
const UserAdTask = require('../models/UserAdTask');

// @desc    Get all active ad tasks
// @route   GET /api/tasks
// @access  Private
exports.getTasks = async (req, res) => {
  try {
    const tasks = await AdTask.find({ active: true, expiryDate: { $gt: new Date() } });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Complete an ad task
// @route   POST /api/tasks/:id/complete
// @access  Private
exports.completeTask = async (req, res) => {
  try {
    const task = await AdTask.findById(req.params.id);
    if (!task || !task.active) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user already completed this task
    const existingCompletion = await UserAdTask.findOne({
      userId: req.user._id,
      adTaskId: task._id,
    });
    if (existingCompletion) {
      return res.status(400).json({ message: 'Task already completed' });
    }

    // Create a completion record
    const userAdTask = await UserAdTask.create({
      userId: req.user._id,
      adTaskId: task._id,
      response: req.body.response, // Assuming the frontend sends the response
    });

    // Here, we would typically validate the response and then approve the task.
    // For now, we auto-approve.
    userAdTask.approved = true;
    await userAdTask.save();

    // The user now earns an entry for the prize draw. We would update the user's entries for the current draw.
    // This logic would be in a service that manages prize draw entries.

    res.json({ message: 'Task completed successfully', entryEarned: task.entryValue });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};