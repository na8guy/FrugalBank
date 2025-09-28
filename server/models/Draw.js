import mongoose from 'mongoose';

const drawSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['weekly', 'monthly', 'goal_completion'],
    required: true
  },
  name: {
    type: String,
    required: true
  },
  prizePool: {
    type: Number,
    required: true,
    default: 0
  },
  entryPeriod: {
    start: Date,
    end: Date
  },
  drawDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['upcoming', 'in_progress', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  minimumTasks: {
    type: Number,
    default: 3
  },
  winners: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    prizeAmount: Number,
    position: Number,
    notified: { type: Boolean, default: false }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Draw', drawSchema);