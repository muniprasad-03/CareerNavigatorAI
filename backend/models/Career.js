const mongoose = require('mongoose');

const CareerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  riasecProfile: {
    R: { type: Number, required: true },
    I: { type: Number, required: true },
    A: { type: Number, required: true },
    S: { type: Number, required: true },
    E: { type: Number, required: true },
    C: { type: Number, required: true }
  },
  skills: [{ type: String }],
  projects: [{ type: String }],
  demandScore: { type: Number, required: true },
  automationRisk: { type: Number, required: true },
  roadmap: [{
    step: { type: String, required: true },
    duration: { type: String, required: true }, // e.g. "3 months", "Year 1"
    description: { type: String },
    links: [{
      title: { type: String, required: true },
      url: { type: String, required: true },
      type: { type: String, enum: ['course', 'youtube', 'other'], default: 'other' }
    }]
  }]
});

module.exports = mongoose.model('Career', CareerSchema);
