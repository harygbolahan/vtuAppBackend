const axios = require('axios');

const DATAHOUSE_AIRTIME_URL = process.env.DATAHOUSE_AIRTIME_URL;
const DATAHOUSE_API_KEY = process.env.DATAHOUSE_API_KEY;

if (!DATAHOUSE_AIRTIME_URL || !DATAHOUSE_API_KEY) {
    throw new Error("Missing external API credentials.");
}

async function purchaseAirtime({ network, mobile_number, amount, Ported_number, airtime_type }) {
    try {
        const response = await axios.post(DATAHOUSE_AIRTIME_URL, {
            network,
            mobile_number,
            amount,
            Ported_number,
            airtime_type,
        }, {
            headers: {
                'Authorization': `Token ${DATAHOUSE_API_KEY}`,
                'Content-Type': 'application/json'
            },
        });
    
        console.log("API Response Data:", response.data);
        
        if (response.data.status === 'failed') {
            throw new Error(`Airtime purchase failed with status code ${response.status}: ${response.statusText}`);
        }
    
        if (response.status === 200 || response.status === 201) {
            return response.data;
        } else {
            console.error(`Airtime purchase failed with status code ${response.status}: ${response.statusText}`);
            throw new Error(`Failed to purchase airtime: ${response.statusText}`);
        }
    } catch (error) {
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error("Error Response Data:", error.response.data);
            console.error("Error Response Status:", error.response.status);
        } else if (error.request) {
            // The request was made but no response was received
            console.error("Error Request Data:", error.request);
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error("Error Message:", error.message);
        }
    
        throw new Error("Airtime purchase failed with the external provider.");
    }
    
}

module.exports = {
    purchaseAirtime
}