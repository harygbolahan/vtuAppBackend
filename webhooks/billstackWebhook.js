const crypto = require('crypto');
const { Payment } = require('../models/paymentModel'); // Import your Payment model
const { Wallet } = require('../models/walletModel');   // Import your Wallet model
const { User } = require('../User/userModels');        // Import your User model
const walletService = require('../services/walletServices'); // Import your WalletService
require('dotenv').config();

// Your BillStack secret key for verifying the webhook
const BILLSTACK_SECRET_KEY = process.env.BILLSTACK_SECRET_KEY;

// Webhook Handler Function
exports.handleBillstackWebhook = async (req, res) => {
  try {
    // Extract relevant data from the request
    const payload = JSON.stringify(req.body); // Ensure the payload is a string
    const billstackSignature = req.header('x-wiaxy-signature');

    // Generate the MD5 hash using the secret key
    const expectedSignature = crypto.createHash('md5')
      .update(BILLSTACK_SECRET_KEY)
      .digest('hex');

    // Check if the signature matches
    if (billstackSignature === expectedSignature) {
      const data = req.body;
      const { event, data: eventData } = data;

      // Only proceed if the event is PAYMENT_NOTIFICATION
      if (event === 'PAYMENT_NOTIFIFICATION' && eventData.type === 'RESERVED_ACCOUNT_TRANSACTION') {
        const {
          reference,
          merchant_reference,
          amount,
          account,
          payer,
        } = eventData;

        const { account_number, account_name, bank_name } = account;
        const { first_name, last_name, account_number: payerAccountNumber } = payer;

        // Check if the transaction already exists in your Payment table
        const existingTransaction = await Payment.findOne({ reference });

        if (existingTransaction) {
          // If the transaction already exists, return a 200 response to avoid reprocessing
          return res.status(200).json({ message: 'Transaction already exists' });
        }

        // If the transaction does not exist, proceed to process the payment
        const userId = '673314ab6676b6b5117bfb3d'; // Adjust if the user ID is stored differently in your data structure

        // Save the payment transaction to the database
        const newPayment = new Payment({
          reference,
          amount,
          userId,
          accountNumber: account_number,
          accountName: account_name,
          bankName: bank_name,
          payerFirstName: first_name,
          payerLastName: last_name,
          payerAccountNumber: payerAccountNumber,
          status: 'completed', // Set status based on your payment flow
          createdAt: new Date(),
        });

        await newPayment.save();

        console.log('UserId', userId);
        // Fund the user's wallet
        const userWallet = await walletService.getUserWallet(userId);

        if (userWallet) {
          // Update wallet balance
          console.log('User wallet', userWallet);

          userWallet.walletBalance += parseFloat(amount);
          await userWallet.save();
        } else {
          // If the user's wallet doesn't exist, create a new one
          const newWallet = new Wallet({
            userId,
            walletBalance: parseFloat(amount),
          });
          await newWallet.save();
        }

        // Send a successful response
        return res.status(200).json({ message: 'success' });
      } else {
        // If the event type is not supported, ignore it
        return res.status(400).json({ message: 'Unsupported event type.' });
      }
    } else {
      // If hash verification fails, deny the request
      return res.status(400).json({
        message: 'Permission denied, invalid signature.',
      });
    }
  } catch (error) {
    console.error('Error processing BillStack webhook:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error while processing webhook',
    });
  }
};
