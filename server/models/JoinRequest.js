const mongoose = require('mongoose');

const JoinRequestSchema = new mongoose.Schema({
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'referenceType', 
  },
  referenceType: {
    type: String,
    required: true,
    enum: ['League', 'Tournament'], 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'declined', 'expired'], 
    default: 'pending' 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  expirationDate: { 
    type: Date 
  },
});

// Create the model
module.exports = mongoose.model('JoinRequest', JoinRequestSchema);
