const mongoose = require('mongoose');

const userAdTaskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  adTaskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdTask',
    required: true,
  },
  completedAt: {
    type: Date,
    default: Date.now,
  },
  // Store the response or proof of completion (if needed)
  response: mongoose.Schema.Types.Mixed,
  // Whether the task was approved (for moderation)
  approved: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model('UserAdTask', userAdTaskSchema);