const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['deposit', 'withdrawal'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending',
  },
  description: {
    type: String,
  },
  mpesaRequestId: { 
    type: String,
  },
  originatorConversationId: { 
    type: String,
  },
}, { timestamps: true });

transactionSchema.index({ mpesaRequestId: 1, originatorConversationId: 1 }); 

module.exports = mongoose.model('Transaction', transactionSchema);
