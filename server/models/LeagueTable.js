const mongoose = require('mongoose');

const LeagueTableSchema = new mongoose.Schema({
  competitionId: { type: mongoose.Schema.Types.ObjectId, refPath: 'competitionType', required: true }, 
  competitionType: { type: String, enum: ['League', 'Tournament'], required: true }, 
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  group: { type: String },
  played: { type: Number, default: 0 },
  won: { type: Number, default: 0 },
  drawn: { type: Number, default: 0 },
  lost: { type: Number, default: 0 },
  points: { type: Number, default: 0 },
  goalsFor: { type: Number, default: 0 },
  goalsAgainst: { type: Number, default: 0 },
  goalDifference: { type: Number, default: 0 },
  homeRecord: {
    played: { type: Number, default: 0 },
    won: { type: Number, default: 0 },
    drawn: { type: Number, default: 0 },
    lost: { type: Number, default: 0 },
    goalsFor: { type: Number, default: 0 },
    goalsAgainst: { type: Number, default: 0 }
  },
  awayRecord: {
    played: { type: Number, default: 0 },
    won: { type: Number, default: 0 },
    drawn: { type: Number, default: 0 },
    lost: { type: Number, default: 0 },
    goalsFor: { type: Number, default: 0 },
    goalsAgainst: { type: Number, default: 0 }
  },
}, { timestamps: true });

// Index for sorting standings
LeagueTableSchema.index({ competitionId: 1, group: 1,  points: -1, goalDifference: -1, goalsFor: -1 });

module.exports = mongoose.model('LeagueTable', LeagueTableSchema);
