const axios = require('axios');

const AUTO_PILOT_URL = process.env.AUTO_PILOT_URL;
const AUTO_PILOT_API_KEY = process.env.AUTO_PILOT_API_KEY;

if (!AUTO_PILOT_URL || !AUTO_PILOT_API_KEY) {
    throw new Error('Missing External API Credentials');
}

async function verifyCableIUC(iuc, cableType) {
    if (!iuc || typeof iuc !== 'string' || iuc.trim() === '') {
        return {
            success: false,
            message: 'Invalid IUC number. Please provide a valid smart card number.',
        };
    }

    if (!cableType || typeof cableType !== 'string' || cableType.trim() === '') {
        return {
            success: false,
            message: 'Invalid cable type. Please provide a valid cable type.',
        };
    }

    try {
        // API request to validate the smart card number
        const response = await axios.post(
            `${AUTO_PILOT_URL}/v1/validate/smartcard-no`,
            {
                smartCardNo: iuc,
                cableType: cableType,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${AUTO_PILOT_API_KEY}`,
                },
            }
        );

        // Check if the response contains the required validation data
        if (response.data && response.data.data && response.data.data.validate) {
            console.log('Cable API response', response.data);
            return {
                success: true,
                message: 'Smart card number validated successfully.',
                data: response.data.data.validate,
            };
        } else {

            console.warn('Unexpected API response format:', response.data);
            return {
                success: false,
                message: 'Validation failed. Please check the IUC number and cable type.',
                data: response.data,
            };
        }
    } catch (error) {
        // Handle errors from the API request
        console.error('Error verifying smart card number:', error.message);

        // Return specific error message if the API responds with an error
        if (error.response && error.response.data && error.response.data.message) {
            return {
                success: false,
                message: `API Error: ${error.response.data.message}`,
            };
        }

        // General error handling
        return {
            success: false,
            message: 'An error occurred while verifying the smart card number. Please try again later.',
        };
    }
}

const purchaseCable = async (cablePayload) => {
    // Validate required fields
    console.log(cablePayload);

    const { cableType, iuc, amount, paymentTypes, customerName, reference, phoneNo } = cablePayload;

    if (!cableType || !iuc || !amount || !paymentTypes || !customerName || !reference) {
        throw new Error("Missing required fields: cableType, iuc, amount, paymentTypes, customerName, or reference");
    }

    const payload = {
        cableType,
        planId: 'GOTV_JOLLI', // You can modify this based on the specific plan selected
        amount,
        paymentTypes,
        customerName,
        smartCardNo: iuc,
        reference,
    };

    // If it's a Showmax plan, add the phone number field
    if (cableType === 'SHOWMAX' && phoneNo) {
        payload.phoneNo = phoneNo;
    }

    try {
        // Make the API call to purchase the cable
        const response = await axios.post(
            `${AUTO_PILOT_URL}/v1/cable`,
            payload,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${AUTO_PILOT_API_KEY}`
                }
            }
        );

        // Log the API response for debugging
        console.log('Cable API response:', response.data);


        return response.data


    } catch (error) {
        // Log the error for debugging
        console.log('Error during cable purchase 1:', error.response.data.data.message);

        return error.response.data.data.message


    }
};



module.exports = {
    verifyCableIUC,
    purchaseCable
}