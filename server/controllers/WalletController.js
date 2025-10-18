const User = require('../models/User');
const Transaction = require('../models/Transaction');
const mpesaService = require('../services/mpesaService');
const mongoose = require('mongoose');
const logger = require('../utils/logger');

exports.deposit = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  const { amount } = req.body;
  const userId = req.user.id;

  try {
    // Input validation
    if (!amount || amount <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid deposit amount' 
      });
    }

    // Fetch user with session
    const user = await User.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Validate phone number
    if (!user.phoneNumber) {
      await session.abortTransaction();
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number is required for deposit' 
      });
    }

    // Create pending transaction first
    const transaction = new Transaction({
      user: userId,
      type: 'deposit',
      amount,
      status: 'pending',
      metadata: {
        balanceBeforeTransaction: user.balance,
        requestedAt: new Date(),
        phoneNumber: user.phoneNumber
      }
    });
    await transaction.save({ session });

    // Initiate STK Push
    let stkResult;
    try {
      console.log(`Initiating STK push for user ${userId}, amount: ${amount}, phone: ${user.phoneNumber}`);
      stkResult = await mpesaService.stkPush(user.phoneNumber, amount);
    } catch (mpesaError) {
      console.error(`STK push failed for user ${userId}:`, mpesaError);
      await session.abortTransaction();
      throw new Error(`STK push failed: ${mpesaError.message}`);
    }

    if (stkResult.ResponseCode === '0') {
      // Update transaction with M-Pesa details
      transaction.mpesaRequestId = stkResult.CheckoutRequestID;
      await transaction.save({ session });

      // Commit the transaction
      await session.commitTransaction();

      console.log(`Deposit initiated successfully for user ${userId}, checkoutRequestId: ${stkResult.CheckoutRequestID}`);
      return res.json({
        success: true,
        message: 'Deposit initiated successfully',
        data: {
          transactionId: transaction._id,
          checkoutRequestId: stkResult.CheckoutRequestID,
          amount,
          currentBalance: user.balance
        }
      });
    } else {
      console.error(`STK push failed for user ${userId}:`, stkResult);
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Deposit initiation failed',
        error: {
          code: stkResult.ResponseCode,
          description: stkResult.ResponseDescription
        }
      });
    }
  } catch (error) {
    console.error('Deposit error:', {
      userId,
      amount,
      error: {
        message: error.message,
        stack: error.stack
      }
    });

    await session.abortTransaction();
    return res.status(500).json({
      success: false,
      message: 'Server error occurred during deposit',
      error: {
        message: error.message,
        code: 'DEPOSIT_ERROR'
      }
    });
  } finally {
    session.endSession();
  }
};

// Helper function to handle STK callback
exports.handleStkCallback = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { Body: { stkCallback } } = req.body;
    const { CheckoutRequestID, ResultCode, ResultDesc } = stkCallback;

    console.log('STK callback received:', {
      checkoutRequestId: CheckoutRequestID,
      resultCode: ResultCode,
      resultDesc: ResultDesc
    });

    // Find the associated transaction
    const transaction = await Transaction.findOne({ 
      mpesaRequestId: CheckoutRequestID 
    }).session(session);

    if (!transaction) {
      console.error(`Transaction not found for CheckoutRequestID: ${CheckoutRequestID}`);
      await session.abortTransaction();
      return res.json({ success: true }); // Always return success to M-Pesa
    }

    // Find the user
    const user = await User.findById(transaction.user).session(session);
    if (!user) {
      console.error(`User not found for transaction: ${transaction._id}`);
      await session.abortTransaction();
      return res.json({ success: true });
    }

    if (ResultCode === 0) {
      // Extract amount from callback if available, otherwise use transaction amount
      const { CallbackMetadata } = stkCallback;
      const paidAmount = CallbackMetadata?.Item?.find(item => item.Name === 'Amount')?.Value || transaction.amount;

      // Update user balance
      user.balance += paidAmount;
      await user.save({ session });

      // Update transaction status
      transaction.status = 'completed';
      transaction.metadata = {
        ...transaction.metadata,
        completedAt: new Date(),
        mpesaReference: CallbackMetadata?.Item?.find(item => item.Name === 'MpesaReceiptNumber')?.Value
      };
      await transaction.save({ session });

      console.log(`Deposit completed successfully for user ${user._id}, amount: ${paidAmount}`);
    } else {
      // Update transaction status to failed
      transaction.status = 'failed';
      transaction.metadata = {
        ...transaction.metadata,
        failedAt: new Date(),
        failureReason: ResultDesc
      };
      await transaction.save({ session });

      console.error(`Deposit failed for user ${user._id}:`, ResultDesc);
    }

    await session.commitTransaction();
    return res.json({ success: true });

  } catch (error) {
    console.error('STK callback error:', error);
    await session.abortTransaction();
    return res.json({ success: true }); // Always return success to M-Pesa
  } finally {
    session.endSession();
  }
};

exports.withdraw = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  const { amount } = req.body;
  const userId = req.user.id;
  
  try {
    // Input validation
    if (!amount || amount <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid withdrawal amount' 
      });
    }

    // Fetch user with session
    const user = await User.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Check balance
    if (user.balance < amount) {
      await session.abortTransaction();
      return res.status(400).json({ 
        success: false,
        message: 'Insufficient balance',
        available: user.balance 
      });
    }

    // Create pending transaction first
    const transaction = new Transaction({
      user: userId,
      type: 'withdrawal',
      amount,
      status: 'pending',
      metadata: {
        balanceBeforeTransaction: user.balance,
        requestedAt: new Date()
      }
    });
    await transaction.save({ session });

    // Deduct amount from balance
    user.balance -= amount;
    await user.save({ session });

    // Initiate M-Pesa payment
    let mpesaResult;
    try {
      mpesaResult = await mpesaService.bulkPayment(user.phoneNumber, amount);
    } catch (mpesaError) {
      await session.abortTransaction();
      throw new Error(`M-Pesa service error: ${mpesaError.message}`);
    }

    if (mpesaResult.ResponseCode === '0') {
      // Update transaction with M-Pesa details
      transaction.mpesaRequestId = mpesaResult.ConversationID;
      transaction.originatorConversationId = mpesaResult.OriginatorConversationID;
      await transaction.save({ session });

      // Commit the transaction
      await session.commitTransaction();

      return res.json({
        success: true,
        message: 'Withdrawal initiated successfully',
        data: {
          transactionId: transaction._id,
          conversationId: mpesaResult.ConversationID,
          amount,
          newBalance: user.balance
        }
      });
    } else {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Withdrawal initiation failed',
        error: {
          code: mpesaResult.ResponseCode,
          description: mpesaResult.ResponseDescription
        }
      });
    }
  } catch (error) {
    await session.abortTransaction();

    // Log the error with proper error tracking
    console.error('Withdrawal error:', {
      userId,
      amount,
      error: {
        message: error.message,
        stack: error.stack
      }
    });

    return res.status(500).json({
      success: false,
      message: 'Server error occurred during withdrawal',
      error: {
        message: error.message,
        code: 'WITHDRAWAL_ERROR'
      }
    });
  } finally {
    session.endSession();
  }
};

exports.wallet = async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      logger.error(`User not found for ID: ${userId}`);
      return res.status(404).json({ message: 'User not found' });
    }

    logger.info(`Balance requested for user ${userId}: ${user.balance}`);
    res.json({ success: true, balance: user.balance, phoneNumber: user.phoneNumber });
  } catch (error) {
    logger.error('Error in getBalance:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.handleB2CResult = async (req, res) => {
  // Start a MongoDB session for transaction safety
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    console.log('Received M-Pesa B2C result:', JSON.stringify(req.body, null, 2));
    
    const { Result } = req.body;
    if (!Result) {
      console.error('Invalid B2C result format:', JSON.stringify(req.body, null, 2));
      return res.status(400).json({ ResultCode: 1, ResultDesc: 'Invalid result format' });
    }

    const { 
      ConversationID, 
      OriginatorConversationID, 
      ResultCode, 
      ResultDesc, 
      TransactionID,
      ResultParameters
    } = Result;

    // Extract transaction amount from ResultParameters if available
    const TransactionAmount = ResultParameters?.ResultParameter?.find(
      param => param.Key === 'TransactionAmount'
    )?.Value || 0;

    // Find the transaction with session
    let transaction = await Transaction.findOne(
      { mpesaRequestId: ConversationID },
      null,
      { session }
    );

    if (!transaction) {
      console.warn(
        `Transaction not found for ConversationID: ${ConversationID}, ` +
        `trying OriginatorConversationID: ${OriginatorConversationID}`
      );
      
      transaction = await Transaction.findOne(
        { mpesaRequestId: OriginatorConversationID },
        null,
        { session }
      );
    }

    if (!transaction) {
      console.error(
        `Transaction not found for ConversationID: ${ConversationID} or ` +
        `OriginatorConversationID: ${OriginatorConversationID}`
      );
      await session.abortTransaction();
      return res.status(404).json({ 
        ResultCode: 1, 
        ResultDesc: 'Transaction not found' 
      });
    }

    console.log(`Found transaction: ${JSON.stringify(transaction, null, 2)}`);

    // Check if transaction is already processed to prevent double processing
    if (transaction.status === 'completed' || transaction.status === 'failed') {
      console.warn(
        `Transaction ${transaction._id} already processed with status: ${transaction.status}`
      );
      await session.abortTransaction();
      return res.json({ 
        ResultCode: 0, 
        ResultDesc: 'Transaction already processed' 
      });
    }

    const user = await User.findById(transaction.user).session(session);
    if (!user) {
      console.error(`User not found for transaction ${transaction._id}`);
      await session.abortTransaction();
      return res.status(404).json({ 
        ResultCode: 1, 
        ResultDesc: 'User not found' 
      });
    }

    if (ResultCode === '0' || ResultCode === 0) {
      // Successful transaction
      try {
        // Update transaction
        transaction.status = 'completed';
        transaction.description = `M-Pesa transaction ID: ${TransactionID}`;
        transaction.mpesaTransactionId = TransactionID;
        transaction.completedAt = new Date();
        
        // Save both user and transaction
        await user.save({ session });
        await transaction.save({ session });
        
        console.log(
          `Withdrawal of ${TransactionAmount} successful for transaction ${transaction._id}, ` +
          `receipt: ${TransactionID}. New user balance: ${user.balance}`
        );
      } catch (error) {
        console.error(`Error processing successful transaction: ${error.message}`);
        await session.abortTransaction();
        return res.status(500).json({ 
          ResultCode: 1, 
          ResultDesc: 'Error processing successful transaction' 
        });
      }
    } else {
      // Failed transaction
      try {
        // Update transaction status
        transaction.status = 'failed';
        transaction.description = ResultDesc;
        transaction.failedAt = new Date();
        
        // Refund amount to user
        user.balance = (user.balance || 0) + transaction.amount;
        
        // Save both user and transaction
        await user.save({ session });
        await transaction.save({ session });
        
        console.log(
          `Refunded ${transaction.amount} to user ${user._id} due to failed withdrawal. ` +
          `New balance: ${user.balance}. Failure reason: ${ResultDesc}`
        );
      } catch (error) {
        console.error(`Error processing failed transaction: ${error.message}`);
        await session.abortTransaction();
        return res.status(500).json({ 
          ResultCode: 1, 
          ResultDesc: 'Error processing failed transaction' 
        });
      }
    }

    // Commit the transaction if everything succeeded
    await session.commitTransaction();
    
    return res.json({ 
      ResultCode: 0, 
      ResultDesc: 'Success',
      TransactionID,
      Balance: user.balance 
    });

  } catch (error) {
    console.error('Error processing M-Pesa B2C result:', error);
    await session.abortTransaction();
    return res.status(500).json({ 
      ResultCode: 1, 
      ResultDesc: 'Internal server error' 
    });
  } finally {
    session.endSession();
  }
};

exports.handleB2CTimeout = async (req, res) => {
  logger.warn('Received M-Pesa B2C timeout:', JSON.stringify(req.body, null, 2));
  
  // Mark transaction as pending or retry after a delay
  // Example: Use a job queue like Bull or a retry mechanism
  
  res.json({ ResultCode: 0, ResultDesc: 'Success' });
};
