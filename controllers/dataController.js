const DataTransaction = require('../models/dataModel');
const dataService = require('../services/dataService');
const walletService = require('../services/walletServices');
const AirtimeTransaction = require('../models/airtimeModel');
const { Types } = require('mongoose');


const { validatePurchaseData } = require('../validations/dataPurchaseValidation');
const DataPlan = require('../models/dataPlansModel');
const { response } = require('../app');


// {network: '1', networkType: 'SME', plan: '118', phoneNumber: '08038295877', pin: '5555'}

const purchaseData = async (req, res) => {
    try {
        const { network, networkType, phoneNumber, pin, plan, amount } = req.body.formData;
        const userId = req.user.id;

        // Log incoming request
        console.log('Request Payload:', { network, networkType, phoneNumber, pin, plan, amount, userId });

        // Validate input data
        const { error } = validatePurchaseData({ network, amount, phoneNumber });
        if (error) return res.status(400).json({ message: error.message });

        // Fetch user's wallet and check walletBalance
        const userWallet = await walletService.getUserWallet(userId);
        if (!userWallet || userWallet.walletBalance < amount) {
            return res.status(400).json({ message: "Insufficient wallet balance" });
        }

        // Network mapping for readability and extensibility
        const networkMap = {
            '1': 'MTN',
            '2': 'GLO',
            '3': '9MOBILE',
            '4': 'AIRTEL',
        };
        const networkName = networkMap[network] || 'UNKNOWN';

        // Create initial data transaction record
        const dataTransaction = await DataTransaction.create({
            userID: userId,
            network,
            type: networkType,
            phoneNumber,
            amount,
            response: "",
            status: "initialised",
        });

        // Deduct amount from wallet
        try {
            const debitWallet = await walletService.deductAmount(userId, amount);
            console.log('Wallet Deduct Payload', userId, amount);

            if (!debitWallet) {
                throw new Error("Wallet deduction failed");
            }
        } catch (walletError) {
            console.error("Wallet deduction error:", walletError);
            return res.status(500).json({ message: "Failed to deduct amount from wallet." });
        }

        // Call external API for data purchase
        try {
            const apiResponse = await dataService.purchaseDataFromExternalAPI({
                network,
                mobile_number: phoneNumber,
                plan,
                Ported_number: true,
            });

            console.log('API Response:', apiResponse);

            // Check if the transaction was successful
            if (!apiResponse || !apiResponse.success) {
                throw new Error(apiResponse.api_response || "Data purchase failed with no detailed response");
            }

            // Update transaction record and finalize response
            dataTransaction.status = "success";
            dataTransaction.externalTransactionId = apiResponse.data?.transaction_id || null;
            dataTransaction.previousBalance = userWallet.walletBalance;
            dataTransaction.newBalance = userWallet.walletBalance - +amount;
            dataTransaction.response = apiResponse.api_response;
            dataTransaction.cashBack = 0; // Placeholder for cashback logic
            dataTransaction.discount = 0; // Placeholder for discount logic
            await dataTransaction.save();

            return res.status(200).json({
                message: "Data purchase successful",
                transaction: {
                    id: dataTransaction._id,
                    network: networkName,
                    phoneNumber,
                    amount,
                    response: dataTransaction.response,
                    previousBalance: dataTransaction.previousBalance,
                    newBalance: dataTransaction.newBalance,
                    cashback: dataTransaction.cashBack,
                    discount: dataTransaction.discount,
                },
            });
        } catch (apiError) {
            console.error("External API error:", apiError);

            // Mark transaction as failed with the error response
            dataTransaction.status = "failed";
            dataTransaction.response = apiError.message || apiError.response?.data?.api_response || "Unknown error";
            await dataTransaction.save();

            // Refund wallet in case of failure
            try {
                await walletService.refundAmount(userId, amount);
                return res.status(500).json({
                    message: "Data purchase failed; refund issued.",
                    error: dataTransaction.response,
                });
            } catch (refundError) {
                console.error("Refund error:", refundError.message);
                return res.status(500).json({
                    message: "Data purchase failed; refund could not be processed. Please contact support.",
                    error: refundError.message,
                });
            }
        }
    } catch (error) {
        console.error("Purchase data error:", error);
        res.status(500).json({
            message: "Data purchase failed due to server error.",
            error: error.message || error,
        });
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







module.exports = { purchaseData, getDataTransactionById, getAllDataTransactions, getDataTransactionsByUser, refundSingleDataTransaction, refundMultipleDataTransactions };
