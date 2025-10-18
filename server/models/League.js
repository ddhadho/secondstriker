const mongoose = require('mongoose');

const LeagueSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  fee: { type: Number, required: true, min: 0, max: 999.99 },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  numberOfTeams: { type: Number, required: true, min: 3, max: 50 },
  rules: {
    type: [String], 
    default: [],    
  },
  awards: { type: String, default: 'first' },
  awardsDistribution: {
    firstPlace: { type: Number, default: 0 },
    secondPlace: { type: Number, default: 0 },
    thirdPlace: { type: Number, default: 0 },
  },
  prizePool: { type: Number, required: true, default: 0 },
  status: { type: String, enum: ['draft', 'ongoing', 'completed'], default: 'draft' },
  fixtureType: { type: String, enum: ['homeAway', 'singleRound'], required: true, default: 'homeAway' },
  settings: {
    pointsForWin: { type: Number, default: 3 },
    pointsForDraw: { type: Number, default: 1 },
    requireScoreConfirmation: { type: Boolean, default: true },
    allowDraws: { type: Boolean, default: true },
    maxScorePerMatch: { type: Number, default: 99 },
  },
}, { timestamps: true });

LeagueSchema.index({ status: 1, createdAt: -1 });
LeagueSchema.index({ creator: 1 });

module.exports = mongoose.model('League', LeagueSchema);