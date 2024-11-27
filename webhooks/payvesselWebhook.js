const crypto = require('crypto');
const { Payment } = require('../models/paymentModel'); // Import your Payment model
const { Wallet } = require('../models/walletModel');   // Import your Wallet model
const { User } = require('../User/userModels');       // Import your User model
const walletService = require('../services/walletServices'); // Import your WalletService

// List of trusted IP addresses from Payvessel
// const trustedIPs = ["3.255.23.38", "162.246.254.36"];

// Your secret key for generating HMAC
const PAYVESSEL_SECRET = process.env.PAYVESSEL_SECRET;

// Webhook Handler Function
exports.handlePayvesselWebhook = async (req, res) => {
  try {
    // Extract relevant data from the request
    const payload = JSON.stringify(req.body); // Ensure the payload is a string
    const payvesselSignature = req.header('HTTP_PAYVESSEL_HTTP_SIGNATURE');
    const ipAddress = req.connection.remoteAddress;

    // Generate the HMAC hash using SHA-512
    const hash = crypto.createHmac('sha512', PAYVESSEL_SECRET)
      .update(payload)
      .digest('hex');

    // Check if the IP address is trusted and the hash matches
    if (payvesselSignature === hash ) {
      const data = req.body;
      const { order, transaction, customer, sender, virtualAccount } = data;
      const { amount, settlement_amount, fee, description, currency } = order;
      const { reference } = transaction;
      const { email, phone } = customer;
      const { senderAccountNumber, senderBankName, senderName } = sender;

      // Check if the transaction already exists in your Payment table
      const existingTransaction = await Payment.findOne({ reference });

      if (existingTransaction) {
        // If the transaction already exists, return a 200 response to avoid reprocessing
        return res.status(200).json({ message: 'Transaction already exists' });
      }

      // If the transaction does not exist, proceed to process the payment
      // (Assuming userId is part of the data for identifying the wallet to fund)
      const userId = '673314ab6676b6b5117bfb3d' ; // Adjust if the user ID is stored differently in your data structure

      // Save the payment transaction to the database
      const newPayment = new Payment({
        reference,
        amount,
        fee,
        settlementAmount: settlement_amount,
        description,
        currency,
        userId,
        senderAccountNumber,
        senderBankName,
        senderName,
        status: 'completed', // Set status based on your payment flow
        createdAt: new Date(),
      });

      await newPayment.save();

        console.log('UserId', userId)
      // Fund the user's wallet
      const userWallet = await walletService.getUserWallet(userId);

      if (userWallet) {
        // Update wallet balance

        console.log('User wallet', userWallet);
        
        userWallet.walletBalance += parseFloat(settlement_amount);
        await userWallet.save();
      } else {
        // If the user's wallet doesn't exist, create a new one
        const newWallet = new Wallet({
          userId,
          walletBalance: parseFloat(settlement_amount),
        });
        await newWallet.save();
      }

      // Send a successful response
      return res.status(200).json({ message: 'success' });
    } else {
      // If IP or hash verification fails, deny the request
      return res.status(400).json({
        message: 'Permission denied, invalid hash or IP address.',
      });
    }
  } catch (error) {
    console.error('Error processing Payvessel webhook:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while processing webhook',
    });
  }
};
