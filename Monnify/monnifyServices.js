const axios = require('axios');

const MONNIFY_BASE_URL = 'https://api.monnify.com';
const API_KEY = process.env.MONNIFY_API_KEY;
const API_SECRET = process.env.MONNIFY_API_SECRET;

async function getAccessToken() {
  try {
    const credentials = Buffer.from(`${API_KEY}:${API_SECRET}`).toString('base64');

    console.log('credentials', credentials);
    
    const response = await axios.post(
      `${MONNIFY_BASE_URL}/api/v1/auth/login`,
      {},
      {
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // console.log('Access token:', response.data.responseBody.accessToken);


    return response.data.responseBody.accessToken;

  } catch (error) {
    // console.error('Error ', error);
    console.error('Error fetching access token:', error.response?.data || error.message);
    throw new Error('Failed to get access token');
  }
}


async function reserveCustomerAccount(accountDetails) {
  try {
    const accessToken = await getAccessToken();

    const response = await axios.post(
      `${MONNIFY_BASE_URL}/api/v2/bank-transfer/reserved-accounts`,
      accountDetails,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Response', response.data);
    
    return response.data;

  } catch (error) {
    // console.log('Error' , error);
    
    console.error('Error reserving customer account:', error?.response?.data?.responseMessage);
    throw new Error(error?.response?.data?.responseMessage || 'Failed to reserve customer account');
  }
}


 // Verify BVN Information
 
async function verifyBVNDetails(bvn, name, dateOfBirth, mobileNo) {
  try {
    const token = await getAccessToken();

    const response = await axios.post(
      `${MONNIFY_BASE_URL}/api/v1/vas/bvn-details-match`,
      { bvn, name, dateOfBirth, mobileNo },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('Response', response.data);
    
    return response.data;
  } catch (error) {
    console.log('Error', error.response.data);
    
    console.error('Error verifying BVN details:', error.response?.data || error.message);
    throw new Error('Failed to verify BVN details');
  }
}



 // Verify NIN Information

async function verifyNIN(nin) {
  try {
    const token = await getAccessToken();

    const response = await axios.post(
      `${MONNIFY_BASE_URL}/api/v1/vas/nin-details`,
      { nin },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error verifying NIN:', error.response?.data || error.message);
    throw new Error('Failed to verify NIN');
  }
}


module.exports = {
  reserveCustomerAccount,
  verifyBVNDetails,
  verifyNIN

};
