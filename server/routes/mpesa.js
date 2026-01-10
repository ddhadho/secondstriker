const express = require('express');
const router = express.Router();
const WalletController = require('../controllers/WalletController');
const TransactionController = require('../controllers/TransactionController');
const auth = require('../middleware/auth');
const validateMpesaCallback = require('../middleware/validateMpesaCallback');

// User wallet operations
router.post('/deposit', auth, WalletController.deposit);
router.post('/withdraw', auth, WalletController.withdraw);
router.get('/wallet', auth, WalletController.wallet);

// Fetch transactions for a specific user
router.get('/transactions', auth, TransactionController.getUserTransactions);

// M-Pesa callback routes
router.post('/callback', 
  validateMpesaCallback,  
  WalletController.handleStkCallback
);

router.post('/b2c/result', 
  validateMpesaCallback,
  WalletController.handleB2CResult
);

router.post('/b2c/queue', 
  validateMpesaCallback, 
  WalletController.handleB2CTimeout
);

module.exports = router;