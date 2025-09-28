const mongoose = require('mongoose');

const prizeDrawSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['Weekly', 'Monthly', 'GoalCompletion'],
    required: true,
  },
  prizePool: {
    type: Number,
    required: true,
  },
  drawDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['Upcoming', 'Open', 'Closed', 'DrawCompleted'],
    default: 'Upcoming',
  },
  // Winners array
  winners: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    prizeAmount: Number,
    position: Number, // 1 for grand prize, etc.
  }],
  // Criteria for entry (e.g., minimum tasks completed, goal reached)
  entryCriteria: mongoose.Schema.Types.Mixed,
});

module.exports = mongoose.model('PrizeDraw', prizeDrawSchema);