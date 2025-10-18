const Transaction = require('../models/Transaction'); 
const { validateInput } = require('../utils/validation');

exports.getUserTransactions = async (req, res) => {
  try {
    const userId = req.user.id; 
    const { limit } = req.query;

    validateInput({ userId }, ['userId']); 

    const transactions = await Transaction.find({ user: userId }) 
      .sort({ createdAt: -1 }) 
      .limit(parseInt(limit, 10) || 10);

    res.status(200).json(transactions);
  } catch (error) {
    console.error('Error fetching user transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};
