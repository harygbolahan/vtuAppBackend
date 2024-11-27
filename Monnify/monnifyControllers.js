const { reserveCustomerAccount, verifyBVNDetails, verifyNIN } = require('./monnifyServices');
const User = require('../User/userModels');

/**
 * Reserve a Virtual Account for a Customer
 */

const contractCode = process.env.MONNIFY_CONTRACT_CODE;


exports.bvnDetails = async (req, res) => {
  const { bvn, name, dateOfBirth, mobileNo } = req.body;

  try {
    const result = await verifyBVNDetails(bvn, name, dateOfBirth, mobileNo);
    return res.status(200).json({ success: true, data: result.responseBody });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.ninDetails = async (req, res) => {
  const { nin } = req.body;

  try {
    const result = await verifyNIN(nin);
    return res.status(200).json({ success: true, data: result.responseBody });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createVirtualAccount = async (req, res) => {
  try {
    const { accountReference, accountName, customerEmail, customerName, nin } = req.body;

    // Validate required fields
    if (!accountReference || !accountName || !customerEmail || !customerName) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Prepare account details
    const accountDetails = {
      accountReference,
      accountName,
      currencyCode: 'NGN',
      customerEmail,
      customerName,
      bvn: null, 
      getAllAvailableBanks: true,
      nin,
      contractCode,
    };

    // Call Monnify Service
    const response = await reserveCustomerAccount(accountDetails);

    // Return response to client
    return res.status(200).json(response);

    //Save to User in DB

  } catch (error) {
    console.error('Error in createVirtualAccount:', error.message);
    return res.status(500).json({ error: error.message });
  }
};
