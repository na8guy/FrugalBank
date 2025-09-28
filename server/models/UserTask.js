import mongoose from 'mongoose';

const userTaskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdTask',
    required: true
  },
  status: {
    type: String,
    enum: ['assigned', 'in_progress', 'completed', 'approved', 'rejected'],
    default: 'assigned'
  },
  answers: [{
    questionId: String,
    answer: mongoose.Schema.Types.Mixed,
    completedAt: Date
  }],
  timeSpent: Number,
  qualityScore: Number,
  entryValue: { type: Number, default: 1 },
  startedAt: Date,
  completedAt: Date,
  approvedAt: Date,
  createdAt: { type: Date, default: Date.now }
});

userTaskSchema.index({ userId: 1, taskId: 1 }, { unique: true });

export default mongoose.model('UserTask', userTaskSchema);