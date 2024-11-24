const axios = require('axios');

const DATAHOUSE_API_URL = process.env.DATAHOUSE_API_URL;
const DATAHOUSE_API_KEY = process.env.DATAHOUSE_API_KEY;

if (!DATAHOUSE_API_URL || !DATAHOUSE_API_KEY) {
  throw new Error("Missing external API credentials.");
}

async function purchaseDataFromExternalAPI({ network, mobile_number, plan, Ported_number }) {
  try {
    // Ensure the required parameters are present
    if (!network || !mobile_number || !plan || Ported_number === undefined) {
      throw new Error("Missing required parameters: network, mobile_number, plan, Ported_number");
    }

    // Log the request for debugging
    console.log(`Sending data purchase request: network=${network}, mobile_number=${mobile_number}, plan=${plan}, Ported_number=${Ported_number}`);

    // Make the API request to the external DataHouse API
    const response = await axios.post(
      DATAHOUSE_API_URL,
      {
        network,
        mobile_number,
        plan,
        Ported_number,
      },
      {
        headers: {
          Authorization: `Token ${DATAHOUSE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Response from DataHouse:', response.data);

    // Check if the response indicates a failure
    if (response.data.Status === 'failed') {
      // Return the response from DataHouse even on failure
      return {
        success: false,
        api_response: response.data.api_response,
        data: response.data,
      };
    }

    // If the status is successful, return the response
    if (response.status === 200 || response.status === 201) {
      return {
        success: true,
        api_response: response.data.api_response,
        data: response.data, // Adjust based on the actual response structure from DataHouse API
      };
    } else {
      console.error(`Unexpected status code ${response?.data?.api_response}: ${response?.data?.Status}`);
      throw new Error(`Unexpected failure: ${response?.data?.api_response} || ${response?.data?.Status}`);
    }
  } catch (error) {
    console.error(`Error purchasing data from DataHouse API: ${error}`);

    // Return the error response, if available, along with the error message
    if (error.response && error.response.data) {
      return {
        success: false,
        api_response: error.response.data.api_response || 'Unknown error',
        data: error.response.data,
      };
    }

    // Default error response
    throw new Error("Data purchase failed with the external provider.", error);
  }
}


module.exports = {
  purchaseDataFromExternalAPI,
};
