const mongoose = require('mongoose');

const RecommendationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  careers: [{
    careerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Career' },
    matchScore: { type: Number },
    explanation: { type: String }
  }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Recommendation', RecommendationSchema);
