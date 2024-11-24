const AirtimeTransaction = require('../models/airtimeModel');
const airtimeService = require('../services/airtimeService');
const walletService = require('../services/walletServices');
const {Types} = require('mongoose');
const {airtimePurchaseValidation} = require('../validations/airtimePurchaseValidation')

const purchaseAirtime = async (req, res) => {
    try {

        console.log('Payload', req.body.formData);
        
        const {network, type, amount, phoneNumber} = req.body.formData;
        const userId = req.user._id;

        const {error} = airtimePurchaseValidation({network, type, amount, phoneNumber});
        if (error) return res.status(400).json({ message: error.message });

        const userWallet = await walletService.getUserWallet(userId);

        if (!userWallet || userWallet.balance < amount) {
            return res.status(400).json({ message: 'Insufficient balance' });
        }

        const airtimeTransaction = await AirtimeTransaction.create({
            userID: userId,
            network,
            type,
            amount,
            phoneNumber,
            response: "",
            status: 'initialised'
        })

        try {
            await walletService.deductAmount(userId, amount);

            const apiResponse = await airtimeService.purchaseAirtime({
                network : 1,
                mobile_number: phoneNumber,
                amount: amount,
                airtime_type: "VTU",
                Ported_number: true,

            });
            console.log('api response', apiResponse);

            airtimeTransaction.status = 'success';
            airtimeTransaction.response = apiResponse.api_response;
            airtimeTransaction.externalTransactionId = apiResponse.transaction_id;
            airtimeTransaction.previousBalance = userWallet.walletBalance;
            airtimeTransaction.newBalance = userWallet.walletBalance - amount;

            // await walletService.deductAmount(userId, amount);
            await airtimeTransaction.save();

            return res.status(200).json({ message: 'Airtime purchase successful', data: airtimeTransaction });
            
        } catch (apiError) {
            console.error('Error purchasing airtime from API', apiError);
            airtimeTransaction.status = 'failed';
            airtimeTransaction.response = apiError.message;
            await airtimeTransaction.save();

            try {
                await walletService.refundAmount(userId, amount);
            } catch (refundError) {
                console.error('Error refunding amount to user wallet :'. refundError.message)
                return res.status(500).json({ message: 'Airtime Purchase failed, Refund could not be processed. Please contact support' });
            }
            return res.status(500).json({ message: 'Airtime Purchase failed, Refund processed', error: apiError.message });
        }
    } catch (error) {
        console.error('Error purchasing airtime', error);
        return res.status(500).json({ message: 'Airtime Purchase failed', error: error.message });
    }
}

const getAirtimeTransactionById = async (req, res) => {
    try {
        const { id } = req.params;
        const transaction = await AirtimeTransaction.findById(id)
        if (!transaction) {
            return res.status(404).json({ message: 'Airtime transaction not found' });
        }
        return res.status(200).json({ transaction });
    } catch (error) {
        console.error('Error getting Airtime transaction by ID', error);
        return res.status(500).json({ message: 'Error getting data transaction by ID', error: error.message });
    }
}

const getAllAirtimeTransactions = async (req, res) => {
    try {
        const transactions = await AirtimeTransaction.find();
        total = transactions.length;
        return res.status(200).json({ message: `All ${total} transactions retrieved successfully`, data: transactions });
    } catch (error) {
        console.error('Error getting all Airtime transactions', error);
        return res.status(500).json({ message: 'Error getting all Airtime transactions', error: error.message });
    }
}

const getAirtimeTransactionsByUserId = async (req, res) => {
    try {
        
        //find transactions by userid from params
        const userId = req.params.id;

        const transactions = await AirtimeTransaction.find({ userID: userId });

        total = transactions.length;
        return res.status(200).json({ message: `All ${total} transactions retrieved successfully`, data: transactions });
    } catch (error) {
        console.error('Error getting Airtime transactions by user ID', error);
        return res.status(500).json({ message: 'Error getting Airtime transactions by user ID', error: error.message });
    }
}

const refundSingleAirtimeTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const transaction = await AirtimeTransaction.findById(id);
        if (!transaction) {
            return res.status(404).json({ message: 'Airtime transaction not found' });
        }
        if (transaction.status === 'failed') {
            return res.status(400).json({ message: 'Airtime transaction already refunded' });
        }
        const amount = transaction.amount;
        const userId = transaction.userID;
        await walletService.refundAmount(userId, +amount);
        transaction.status = 'failed';
        await transaction.save();
        return res.status(200).json({ message: 'Airtime transaction refunded successfully', data: transaction });
    } catch (error) {
        console.error('Error refunding Airtime transaction', error);
        return res.status(500).json({ message: 'Error refunding Airtime transaction', error: error.message });
    }

}

const refundMultipleAirtimeTransactions = async (req, res) => {
    try {
        const {transactionIds} = req.body;
        const refundedTransactions = [];

        for (const id of transactionIds) {
            const transaction = await AirtimeTransaction.findById(id);
            if (!transaction) {
                console.error(`Airtime transaction with ID ${id} not found`);
                continue;
            }
            if (transaction && transaction.status !== 'failed') {
                await walletService.refundAmount(transaction.userID, +transaction.amount);
                transaction.status = 'failed';
                await transaction.save();
                refundedTransactions.push(transaction);
            }
        }

        res.status(200).json({ message: 'Airtime transactions refunded successfully', data: refundedTransactions });
        } catch (error) {
        console.error('Error refunding Airtime transactions', error);
        return res.status(500).json({ message: 'Error refunding Airtime transactions', error: error.message });
        }
}

module.exports = {
    purchaseAirtime,
    getAirtimeTransactionById,
    getAllAirtimeTransactions,
    refundSingleAirtimeTransaction,
    refundMultipleAirtimeTransactions,
    getAirtimeTransactionsByUserId
}