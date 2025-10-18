const mongoose = require('mongoose');

const FixtureSchema = new mongoose.Schema({
  // Reference to the associated competition (league or tournament)
  competitionId: { type: mongoose.Schema.Types.ObjectId, refPath: 'competitionType', required: true },
  competitionType: { 
    type: String, 
    enum: ['League', 'Tournament'], // Can be extended with additional types in the future
    required: true 
  },
  
  // Participating teams
  team1: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  team2: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Match type and date
  isHomeAway: { type: Boolean, required: true },

  // Round information (e.g., group stage, quarterfinals)
  round: { type: String, required: true }, 
  group: { type: String },
  stage: { type: String },
  position: { type: Number },

  result: {
    team1Score: { type: Number, default: null },
    team2Score: { type: Number, default: null },
  },

  status: { 
    type: String, 
    enum: ['pending', 'completed'], 
    default: 'pending' 
  },
});

module.exports = mongoose.model('Fixture', FixtureSchema);
