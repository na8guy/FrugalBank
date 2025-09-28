import mongoose from 'mongoose';

const adTaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  description: String,
  sponsor: {
    name: String,
    logo: String,
    industry: String
  },
  type: {
    type: String,
    enum: ['survey', 'product_feedback', 'creative_challenge', 'educational', 'market_research'],
    required: true
  },
  requirements: {
    minTimeMinutes: { type: Number, default: 3 },
    skillLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    },
    prerequisites: [String]
  },
  taskDetails: {
    questions: [{
      question: String,
      type: { type: String, enum: ['multiple_choice', 'text', 'rating'] },
      options: [String],
      required: Boolean
    }],
    resources: [{
      type: { type: String, enum: ['video', 'article', 'image'] },
      url: String,
      title: String
    }],
    successCriteria: mongoose.Schema.Types.Mixed
  },
  reward: {
    entries: { type: Number, default: 1 },
    bonusAmount: { type: Number, default: 0 },
    prizePoolContribution: { type: Number, default: 0 }
  },
  targeting: {
    minAge: Number,
    maxAge: Number,
    countries: [String],
    interests: [String],
    subscriptionTiers: [String]
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'completed'],
    default: 'draft'
  },
  analytics: {
    completions: { type: Number, default: 0 },
    avgCompletionTime: Number,
    satisfactionScore: Number,
    conversionRate: Number
  },
  schedule: {
    startDate: Date,
    endDate: Date,
    maxCompletions: Number
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('AdTask', adTaskSchema);