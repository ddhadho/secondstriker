const mongoose = require('mongoose');

const TournamentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  fee: { type: Number, required: true, min: 0, max: 999.99 },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  teamsPerGroup: { type: Number, required: true, min: 2, max: 10, default: 4 },
  numberOfGroups: { type: Number, required: true, min: 2, max: 24, default: 2 },
  rules: {
    type: [String], 
    default: [],
  },
  awards: { type: String, default: 'first' },
  winner: { type: String },
  runnerUp: { type: String },
  awardsDistribution: {
    firstPlace: { type: Number, default: 0 },
    secondPlace: { type: Number, default: 0 },
  },
  prizePool: { type: Number, required: true, default: 0 },
  status: { type: String, enum: ['draft', 'ongoing', 'completed'], default: 'draft' },
  fixtureType: { type: String, enum: ['homeAway', 'singleRound'], required: true, default: 'homeAway' },
  format: { type: String, enum: ['knockout', 'groupKnockout'], required: true, default: 'knockout' },
  stage: { type: String, enum: ['groupStage', 'knockout'] }, 
      
}, { timestamps: true });

TournamentSchema.index({ status: 1, createdAt: -1 });
TournamentSchema.index({ creator: 1 });

module.exports = mongoose.model('Tournament', TournamentSchema);
