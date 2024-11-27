const axios = require('axios');

const payvesselAPIKey = process.env.PAYVESSEL_API_KEY;
const payvesselAPISecret = process.env.PAYVESSEL_API_SECRET;

const createVirtualAccount = async (customerData) => {
  const apiEndpoint = 'https://api.payvessel.com/api/external/request/customerReservedAccount/';
  const headers = {
    'api-key': payvesselAPIKey,
    'api-secret': 'Bearer PVSECRET-5LZNFFNT8N9NF6SXUZPWEYQ0Q2Y',
    'Content-Type': 'application/json'
  };

  try {
    const response = await axios.post(apiEndpoint, customerData, { headers });
    console.log('Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating virtual account:', error.response?.data || error.message);
    throw error;
  }
};

// Sample customer data
const customerData = {
  email: 'johndoe@gmail.com',
  name: 'JOHN DOE',
  phoneNumber: '090xxxxxxx2',
  bankcode: ['120001'],
  account_type: 'STATIC', // or 'DYNAMIC'
  businessid: 'XXXXXXXXXXXXXXXXXXX',
  bvn: 'xxxxxxxxxxx',
  nin: 'xxxxxxxxx',
};

// Call the function
createVirtualAccount(customerData).then((data) => {
  console.log('Virtual account created:', data);
});
