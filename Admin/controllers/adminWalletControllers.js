//controller to manage admin actions on user's wallet

const AdminWallet = require("../models/adminWallet")
const Transactions = require("../../models/generalModel")
const Users = require("../../User/userModels")
const AppError = require("../../utils/AppError")
const walletService = require("../../services/walletServices")



//Credit or Debit User wallet via email


const creditDebitUserWallet = async (req, res, next) => {
    try {

        console.log('request body', req.body);
        
        const { email, amount, type, description } = req.body;

        // Validate input
        if (!email || amount == null || !type || !description) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (typeof amount !== "number" || amount <= 0) {
            return res.status(400).json({ message: "Invalid amount" });
        }

        const user = await Users.findOne({ email }).select({ walletBalance: 1, firstName: 1, lastName: 1, email: 1 });

        console.log('User', user)
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }


        if (type !== "credit" && type !== "debit") {
            return res.status(400).json({ message: "Invalid transaction type" })
        }

        // Update wallet balance
        if (type === "credit") {
            user.walletBalance += amount;
        } else if (type === "debit") {
            // if (user.walletBalance < amount) {
            //     return res.status(400).json({ message: "Insufficient balance" });
            // }
            user.walletBalance -= amount;
        }

        // Save user wallet balance update
        await user.save();

        // Save transaction to database
        const transaction = await AdminWallet.create({
            user: user._id,
            type,
            email: user.email,
            previousBalance: user.walletBalance - amount,
            newBalance: user.walletBalance,
            amount,
            description,
        });

        res.status(200).json({
            success: true,
            message: `Wallet ${type === "credit" ? "credited" : "debited"} successfully`,
            data: {
                email: user.email,
                previosBalance: user.walletBalance - amount,
                walletBalance: user.walletBalance,
                transaction,
            },
        });
    } catch (err) {
        return next(err);
    }
};

const getAllTransactions = async (req, res, next) => {
    try {
        const transactions = await Transactions.find().sort({ createdAt: -1 }); // Sort by `createdAt` in descending order
        res.status(200).json(transactions);
    } catch (error) {
        next(error); // Pass the error to your error-handling middleware
    }
};

const refundTransaction = async (req, res, next) => {
    try {
        const { transactionId } = req.body;

        // console.log('req param', req.params);
        
        // const { amount, description } = req.body;

        if (!transactionId) {
            return res.status(400).json({ message: "Transaction ID is required" });
        }

        const transaction = await Transactions.findById(transactionId);

        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }

        if (transaction.status === "failed") {
            return res.status(400).json({ message: "Transaction already refunded" });
        }

        if (transaction.status === "Refund") {
            return res.status(400).json({ message: "Transaction already refunded" });
        }

        await walletService.refundAmount(transaction.userID, transaction.amount);

        // Refund the transaction
        transaction.status = "failed";
        await transaction.save();

        //Create a new transaction

        Transactions.create({
            userID: transaction.userID,
            transactionId: `REF-${transaction.transactionId}`,
            serviceType: "Refund",
            status: "Refund",
            user: transaction.user,
            type: transaction.type,
            email: transaction.email,
            previousBalance: transaction.newBalance,
            newBalance: transaction.newBalance + transaction.amount,
            amount: transaction.amount,
            description: "Refund for failed transaction", // Add a description for the refund
            failedAt: transaction.createdAt,

        })

        res.status(200).json({ message: "Transaction refunded successfully", data: transaction });
    } catch (error) {
        res.status(500).json({ message: "Error refunding transaction", error });

    }
}




module.exports = {
    creditDebitUserWallet,
    getAllTransactions,
    refundTransaction
}