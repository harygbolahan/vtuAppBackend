const DataTransaction = require('../models/generalModel');
const dataService = require('./dataService');
const walletService = require('../services/walletServices');
const AirtimeTransaction = require('../Airtime/airtimeModel');
const { Types } = require('mongoose');
const purchaseQueue = require('./dataQueue');


const { validatePurchaseData } = require('./dataPurchaseValidation');
const DataPlan = require('./dataPlansModel');

const purchaseData = async (req, res) => {
    try {
        const { network, networkType, phoneNumber, pin, plan, amount } = req.body.formData;
        const userId = req.user.id;


        // Log incoming request
        console.log('Enqueuing purchase:', { network, networkType, phoneNumber, pin, plan, amount, userId });

        //Validate PIn

        if (pin !== req.user.transaction_pin) {
            console.log('Invalid PIN');

            return res.status(401).json({ message: "Invalid PIN" });
            
        }

        // Validate input data
        const { error } = validatePurchaseData({ network, amount, phoneNumber });
        if (error) return res.status(400).json({ message: error.message });

        // Enqueue the purchase job (Ensure `purchaseQueue` is properly imported and used)
        const purchaseJob = await purchaseQueue.add('purchaseJob', {
            userId,
            network,
            networkType,
            phoneNumber,
            plan,
            amount,
        });

        return res.status(200).json({
            message: "Your purchase request has been queued and will be processed shortly.",
            jobId: purchaseJob.id, // Pass the `jobId` back to the frontend
        });
    } catch (error) {
        console.error("Error queuing purchase request:", error);
        return res.status(500).json({
            message: "Failed to queue your request.",
            error: error.message || error,
        });
    }
};

const getStatus = async (req, res) => {
    try {
        const { jobId } = req.params;

        const job = await purchaseQueue.getJob(jobId);
        if (!job) {
            return res.status(404).json({ status: 'fail', message: `Job with ID ${jobId} not found` });
        }

        const state = await job.getState(); // Get the job's state
        const result = job.returnvalue || {}; // Get the stored return value from the worker
        const errorMessage = job.failedReason || null; // Get the failure reason, if any

        const response = {
            status: 'success',
            message: 'Job status retrieved successfully',
            data: {
                state,
                ...(state === 'completed' && result ? { apiResponse: result } : {}),
                ...(state === 'failed' && errorMessage ? { error: errorMessage } : {}),
            },
        };

        return res.status(200).json(response);
    } catch (error) {
        console.error('Error retrieving job status:', error);
        return res.status(500).json({ status: 'fail', message: 'Failed to retrieve job status' });
    }
};

// Get single data transaction by ID
const getDataTransactionById = async (req, res) => {
    try {
        const { id } = req.params;
        const transaction = await DataTransaction.findById(id);

        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }

        res.status(200).json({ message: "Transaction retrieved successfully", data: transaction });
    } catch (error) {
        console.error("Error fetching data transaction:", error);
        res.status(500).json({ message: "Failed to retrieve transaction", error: error.message });
    }
};

// Get all data transactions
const getAllDataTransactions = async (req, res) => {
    try {
        const transactions = await DataTransaction.find();
        total = transactions.length;
        res.status(200).json({ message: `All ${total} transactions retrieved successfully`, data: transactions });
    } catch (error) {
        console.error("Error fetching all transactions:", error);
        res.status(500).json({ message: "Failed to retrieve transactions", error: error.message });
    }
};

// Get all data transactions by user
const getDataTransactionsByUser = async (req, res) => {
    try {
        const userId = req.user.id; // Assuming this is correctly retrieving the logged-in user's ID
        console.log('UserID:', userId);

        // Use the correct field name 'userID' to filter by user
        const airtimeTransactions = await AirtimeTransaction.find({ userID: userId }).sort({ createdAt: -1 });
        const dataTransactions = await DataTransaction.find({ userID: userId }).sort({ createdAt: -1 });

        // Combine transactions and sort by date (most recent first)
        const transactions = [...airtimeTransactions, ...dataTransactions].sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        if (!transactions.length) {
            return res.status(404).json({ message: "No transactions found for this user" });
        }

        res.status(200).json({ message: `${transactions.length} User transactions retrieved successfully`, data: transactions });
    } catch (error) {
        console.error("Error fetching user transactions:", error);
        res.status(500).json({ message: "Failed to retrieve user transactions", error: error.message });
    }
};



// Refund single data transaction

const refundSingleDataTransaction = async (req, res) => {
    try {
      const { id } = req.params;
  
      // Log the transaction ID for debugging
      console.log("Received transaction ID:", id);
  
      // Validate the transaction ID format
      if (!Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid transaction ID. Please provide a valid ID.' });
      }
  
      const transaction = await DataTransaction.findById(id);
  
      if (!transaction) {
        return res.status(404).json({ message: 'Transaction not found' });
      }
  
      if (transaction.status === 'failed') {
        return res.status(400).json({ message: 'Transaction already refunded' });
      }

      console.log('transaction',transaction);
      
  
      // Process the refund
      await walletService.refundAmount(transaction.userID, transaction.amount);
  
      // Update transaction status
      transaction.status = 'failed';
      await transaction.save();
  
      res.status(200).json({ message: 'Transaction refunded successfully', data: transaction });
    } catch (error) {
      console.error("Error refunding transaction:", error);
      res.status(500).json({ message: "Failed to refund transaction", error: error.message });
    }
  };
  
// Refund multiple data transactions
const refundMultipleDataTransactions = async (req, res) => {
    try {
    
        const { transactionIds } = req.body;
        const refundedTransactions = [];

        for (const id of transactionIds) {
            const transaction = await DataTransaction.findById(id);

            if (transaction && transaction.status !== 'failed') {
                await walletService.refundAmount(transaction.userID, transaction.amount);

                transaction.status = 'failed';
                await transaction.save();

                refundedTransactions.push(transaction);
            }
        }

        res.status(200).json({
            message: `${refundedTransactions.length} transactions refunded successfully`,
            data: refundedTransactions,
        });
    } catch (error) {
        console.error("Error refunding multiple transactions:", error);
        res.status(500).json({ message: "Failed to refund transactions", error: error.message });
    }
};







module.exports = { purchaseData, getDataTransactionById, getAllDataTransactions, getDataTransactionsByUser, refundSingleDataTransaction, refundMultipleDataTransactions, getStatus };
