const mongoose = require('mongoose');

const SavedCareerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  careerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Career', required: true },
  savedAt: { type: Date, default: Date.now }
});

// Compound index to ensure a user can't save the same career twice
SavedCareerSchema.index({ userId: 1, careerId: 1 }, { unique: true });

module.exports = mongoose.model('SavedCareer', SavedCareerSchema);
