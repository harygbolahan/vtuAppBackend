const express = require('express');
const sha512 = require('js-sha512').sha512;
const Wallet = require('../models/walletModel'); // Import the Wallet model
const { validateHash, isDuplicate } = require('../utils/security'); // Security helpers
const router = express.Router();

// Replace with your Monnify client secret
const MONNIFY_CLIENT_SECRET = process.env.MONNIFY_API_SECRET

router.post('/monnify', async (req, res) => {
  try {
    const requestBody = req.body;

    // Step 1: Validate Monnify signature
    const monnifySignature = req.headers['monnify-signature'];
    if (!validateHash(requestBody, monnifySignature, MONNIFY_CLIENT_SECRET)) {
      console.error('Invalid hash');
      return res.status(400).send('Invalid hash');
    }

    // Step 2: Prevent duplicate processing
    const { transactionReference } = requestBody.eventData;
    if (await isDuplicate(transactionReference)) {
      console.error('Duplicate notification detected');
      return res.status(400).send('Duplicate notification');
    }

    // Step 3: Process webhook event
    const eventType = requestBody.eventType;
    const eventData = requestBody.eventData;

    switch (eventType) {
      case 'SUCCESSFUL_TRANSACTION':
        // Step 4: Fund the user's wallet
        const { amountPaid, customer } = eventData;
        const walletOwnerEmail = customer.email; // Assuming email maps to the user

        const wallet = await Wallet.findOne({ email: walletOwnerEmail });
        if (!wallet) {
          console.error('Wallet not found for user:', walletOwnerEmail);
          return res.status(404).send('Wallet not found');
        }

        // Update wallet balance
        wallet.balance += amountPaid;
        await wallet.save();

        console.log(`Wallet funded: ${walletOwnerEmail} - Amount: ${amountPaid}`);
        break;

      default:
        console.log('Unhandled event type:', eventType);
    }

    // Step 5: Acknowledge receipt quickly
    res.status(200).send('Notification received');
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).send('Server error');
  }
});

module.exports = router;
