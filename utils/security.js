const sha512 = require('js-sha512').sha512;
const Wallet = require('../models/walletModel');

// Validate Monnify signature hash
const validateHash = (requestBody, receivedHash, clientSecret) => {
  const computedHash = sha512.hmac(clientSecret, JSON.stringify(requestBody));
  return computedHash === receivedHash;
};

// Check for duplicate transaction reference
const isDuplicate = async (transactionReference) => {
  const transaction = await Wallet.findOne({
    'transactionHistory.transactionReference': transactionReference,
  });
  return !!transaction; // Returns true if duplicate exists
};

module.exports = { validateHash, isDuplicate };
