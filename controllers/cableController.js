const CableTransaction = require('../models/cableModel');
const cableService = require('../services/cableService');
const walletService = require('../services/walletServices');
const { Types } = require('mongoose');
const cableValidations = require('../validations/cableValidations');


const verifyCableIUC = async (req, res) => {
    try {
        // Destructure smartCardNo and cableType from the request body

        console.log('Request body', req.body);
        
        const { smartCardNo, cableType } = req.body.formData;

        // Validate inputs
        if (!smartCardNo || typeof smartCardNo !== 'string' || smartCardNo.trim() === '') {
            return res.status(400).json({ message: 'Invalid smart card number. Please provide a valid smart card number.' });
        }

        if (!cableType || typeof cableType !== 'string' || cableType.trim() === '') {
            return res.status(400).json({ message: 'Invalid cable type. Please provide a valid cable type.' });
        }

        // Call the service to verify the cable IUC
        const cable = await cableService.verifyCableIUC(smartCardNo, cableType);

        // Check if the cable verification was successful
        if (cable && cable.success) {
            return res.status(200).json({
                message: "IUC is valid",
                cable: cable.data, // Assuming `cable.data` contains the necessary validation data
            });
        } else {
            // If no valid data was returned from the service
            return res.status(404).json({ message: "IUC is not valid" });
        }
    } catch (error) {
        // Log the error for internal tracking
        console.error('Error during IUC verification:', error);

        // Handle specific API errors if available, otherwise return a generic error message
        if (error.response && error.response.data && error.response.data.message) {
            return res.status(500).json({
                message: `API Error: ${error.response.data.message}`,
                error: error.message,
            });
        }

        // Return a general internal server error response
        return res.status(500).json({
            message: "Internal server error. Please try again later.",
            error: error.message,
        });
    }
};


const purchaseCable = async (req, res) => {
    try {
        const userId = req.user._id;
        const { iuc, amount, cableType, planId, customerName, paymentTypes, phoneNo } = req.body;

        console.log(req.body);

        // Validate required fields
        if (!iuc || !amount || !userId || !cableType || !planId || !paymentTypes || !customerName) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        // Step 1: Verify the IUC (smart card number)
        const cable = await cableService.verifyCableIUC(iuc);
        if (!cable) {
            return res.status(404).json({ message: "IUC is not valid" });
        }

        // Step 2: Fetch the user's wallet to check balance
        const wallet = await walletService.getUserWallet(userId);
        if (!wallet) {
            return res.status(404).json({ message: "Wallet not found" });
        }

        // Step 3: Check if the wallet balance is sufficient for the transaction
        if (wallet.balance < amount) {
            return res.status(403).json({ message: "Insufficient balance" });
        }

        // Step 4: Generate a unique reference starting with the current year
        const year = new Date().getFullYear();
        const reference = `${year}${Date.now()}${Math.floor(Math.random() * 1000000000)}`;

        const cableTransaction = await CableTransaction.create({
            userID: userId,
            cableType,
            planId,
            amount,
            paymentTypes,
            customerName,
            iucNumber: iuc,
            reference,
            status: 'initialised',
        });

        // Step 5: Prepare the payload for the cable purchase request
        const cablePayload = {
            cableType,
            planId,
            amount,
            paymentTypes,
            customerName,
            iuc,
            reference,
        };

        // If it's a Showmax plan, add the phone number field
        if (cableType === 'SHOWMAX' && phoneNo) {
            cablePayload.phoneNo = phoneNo;
        }

        // Deduct the amount from the wallet before making the purchase
        await walletService.deductAmount(userId, amount);

        // Step 6: Call the API for the cable purchase
        const apiResponse = await cableService.purchaseCable(cablePayload);

        if (apiResponse.code === '200') {
            // Successful response from the API
            cableTransaction.status = 'success';
            cableTransaction.response = apiResponse.data.message;
            cableTransaction.externalTransactionId = apiResponse.data.reference;
            cableTransaction.previousBalance = wallet.balance;
            cableTransaction.newBalance = wallet.balance - amount;
            cableTransaction.cashBack = 0;
            cableTransaction.discount = 0;
            cableTransaction.completedAt = Date.now();

            // Save the successful transaction
            await cableTransaction.save();

            return res.status(200).json({
                message: "Cable purchased successfully",
                cableTransaction,
            });
        } else {
            // Failed API response (code other than 200)
            cableTransaction.status = 'failed';
            cableTransaction.response = apiResponse || "Transaction failed";
            cableTransaction.externalTransactionId = null;
            cableTransaction.previousBalance = wallet.balance;
            cableTransaction.newBalance = wallet.balance;

            // Save the failed transaction
            await cableTransaction.save();

            // Refund the deducted amount
            await walletService.refundAmount(userId, amount);

            return res.status(400).json({
                message: "Cable purchase failed",
                error: apiResponse || "Unknown error",
            });
        }
    } catch (error) {
        // Error during the API call or other parts of the transaction flow
        console.error('Error during cable purchase:', error);

        try {
            // If there's an error after the wallet deduction, refund the user
            if (amount && userId) {
                await walletService.refundAmount(userId, amount);
            }
        } catch (refundError) {
            console.error('Refund Error', refundError);
            return res.status(500).json({
                message: 'Cable purchase failed, and refund was not successful. Please contact support.',
                error: refundError,
            });
        }

        // Return a general error response
        return res.status(500).json({
            message: "Internal server error. Please try again later.",
            error: error.message,
        });
    }
};


const getAllCableTransactionsByUser = async (req, res) => {
    try {
        const userId = req.user._id;
        console.log();


        // Fetch all cable transactions for the user
        const cableTransactions = await CableTransaction.find({ userID: userId });

        total = cableTransactions.length;

        // Return the cable transactions as a response
        res.status(200).json({
            message: `${total} Cable transactions retrieved successfully`,
            cableTransactions,
        });
    } catch (error) {
        // Log the error to the console for debugging
        console.log('Error during cable purchase 2:', error);

        // Return a 500 error response with the error message
    }
}

const getCableTransactionById = async (req, res) => {
    try {
        const userId = req.user._id;
        const cableTransactionId = req.params.id;

        // Fetch the cable transaction by ID
        const cableTransaction = await CableTransaction.findById(cableTransactionId);

        // Check if the cable transaction exists
        if (!cableTransaction) {
            return res.status(404).json({
                message: 'Cable transaction not found',
            });
        }

        // Check if the user is authorized to view the cable transaction
        if (cableTransaction.userID.toString() !== userId.toString()) {
            return res.status(403).json({
                message: 'You are not authorized to view this cable transaction',
            });
        }

        // Return the cable transaction as a response
        res.status(200).json({
            message: 'Cable transaction retrieved successfully',
            cableTransaction,
        })
    } catch (error) {
        // Log the error to the console for debugging
        console.log('Error viewing Cable Transaction:', error);

        // Return a 500 error response with the error message
        return res.status(500).json({
            message: 'Internal server error. Please try again later.',
            error: error.message,
        });
    }
}

const getAllCableTransactions = async (req, res) => {
    try {

        // Fetch all cable transactions for the user
        const cableTransactions = await CableTransaction.find();

        total = cableTransactions.length;

        // Return the cable transactions as a response
        res.status(200).json({
            message: `${total} Cable transactions retrieved successfully`,
            cableTransactions,
        });
    } catch (error) {
        // Log the error to the console for debugging
        console.log('Error fectching all cable transactions:', error);
        res.status(500).json({
            message: 'Internal server error. Please try again later.',
            error: error.message,
        });
    }
}

const refundSingleCableTransaction = async (req, res) => {
    try {
        
        const cableTransactionId = req.params.id;

        // Fetch the cable transaction by ID
        const cableTransaction = await CableTransaction.findById(cableTransactionId);

        // Check if the cable transaction exists
        if (!cableTransaction) {
            return res.status(404).json({
                message: 'Cable transaction not found',
            });
        }

        if (cableTransaction.status === 'failed') {
            throw new Error('Cable transaction already refunded');
        }

        const userId = cableTransaction.userID;

        await walletService.refundAmount(userId, cableTransaction.amount);

        cableTransaction.status = 'failed'

        await cableTransaction.save();

        res.status(200).json({
            message: 'Cable transaction refunded successfully',
        });
    } catch (error) {
        // Log the error to the console for debugging
        console.log('Error refunding Cable Transaction:', error);

        // Return a 500 error response with the error message
        return res.status(500).json({
            message: error.message,
        })
    }
        
}

const refundMultipleCableTransactions = async (req, res) => {
    try {
        const { cableTransactionIds } = req.body;
        const refundedTransactions = [];

        for (const cableTransactionId of cableTransactionIds) {
            // Fetch the cable transaction by ID
            const cableTransaction = await CableTransaction.findById(cableTransactionId);

            console.log('Cable Transaction:', cableTransaction);

            // Check if the cable transaction exists and its status is not 'failed'
            if (cableTransaction && cableTransaction.status !== 'failed') {
                try {
                    // Refund the transaction
                    await walletService.refundAmount(cableTransaction.userID, cableTransaction.amount);

                    // Update the status to 'failed'
                    cableTransaction.status = 'failed';
                    await cableTransaction.save();

                    // Add the refunded transaction to the response list
                    refundedTransactions.push(cableTransaction);
                } catch (refundError) {
                    // Log and handle the refund error for this transaction
                    console.error(`Refund Error for Transaction ID ${cableTransaction._id}:`, refundError);
                }
            }
        }

        res.status(200).json({
            message: 'Cable transactions refunded successfully',
            refundedTransactions,
        });
        
    } catch (error) {
        // Log the error to the console for debugging
        console.error('Error refunding Cable Transactions:', error);

        // Return a 500 error response with the error message
        return res.status(500).json({
            message: 'Internal server error. Please try again later.',
            error: error.message,
        });
    }
};





    module.exports = {
        verifyCableIUC,
        purchaseCable,
        getAllCableTransactionsByUser,
        getCableTransactionById,
        getAllCableTransactions,
        refundSingleCableTransaction,
        refundMultipleCableTransactions,
    }