const { reserveCustomerAccount, verifyBVNDetails, verifyNIN } = require('./monnifyServices');
const User = require('../User/userModels');


const contractCode = process.env.MONNIFY_CONTRACT_CODE;


exports.bvnDetails = async (req, res) => {

  //get User ID

  const userId = req.user._id;

  console.log('request', req.user);
  

  console.log('Req', req.body);
  
  const { bvn, name, dateOfBirth, mobileNo } = req.body;

  try {
    const result = await verifyBVNDetails(bvn, name, dateOfBirth, mobileNo);

    //Save to User in DB

    const user = await User.findByIdAndUpdate(userId, { 
      bvn: bvn, 
      kycStatus: 'verified',
      isVerified: true
    
    }, { new: true });

    console.log('User', user);
    

    return res.status(200).json({ success: true, data: result.responseBody });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.ninDetails = async (req, res) => {

  const userId = req.user._id;

  const { nin } = req.body;

  try {
    const result = await verifyNIN(nin);

    const user = await User.findByIdAndUpdate(userId, { 
      nin: nin, 
      kycStatus: 'verified',
      isVerified: true
    
    }, { new: true });

    console.log('User', user);

    return res.status(200).json({ success: true, data: result.responseBody });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createVirtualAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    const { accountReference, accountName, customerEmail, customerName, nin, bvn } = req.body.accountData;

    // Validate required fields
    if (!accountReference || !accountName || !customerEmail || !customerName ) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Prepare account details
    const accountDetails = {
      accountReference,
      accountName,
      currencyCode: 'NGN',
      customerEmail,
      customerName,
      bvn,
      getAllAvailableBanks: false,
      preferredBanks: ["50515", "035", ],
      nin,
      contractCode,
    };

    // Call Monnify Service
    const response = await reserveCustomerAccount(accountDetails);

    const accounts = response.responseBody.accounts;

    // Log the response for debugging
    console.log('response from reserved account', response.responseBody);

    // Map the accounts into the structure required for `bankDetails`
    const bankDetails = accounts.map((account, index) => ({
      bankName: account.bankName,
      accountNumber: account.accountNumber,
      accountName: account.accountName,
      isPrimary: index === 0, // Set the first account as primary
    }));

    // Update the user's bank details in the database
    const user = await User.findByIdAndUpdate(
      userId,
      { bankDetails },
      { new: true } // Return the updated document
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return the updated user or response
    return res.status(200).json({ user, bankDetails });
  } catch (error) {
    console.error('Error in createVirtualAccount:', error.message);
    return res.status(500).json({ error: error.message });
  }
};

