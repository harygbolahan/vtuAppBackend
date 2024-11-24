const axios = require("axios");

const Electric = require("../models/electricModel");

const MERRYBILL_URL = process.env.MERRYBILL_URL;
const MERRYBILL_API_KEY = process.env.MERRYBILL_API_KEY;


const purchaseElectricToken = async ({meterNumber,productId,type,amount, pin}) => {
    try {

        console.log('Payload', meterNumber, productId, type, amount, pin);
        
        const response = await axios.post(
            `${MERRYBILL_URL}/electricity`, { 
                meter_number: meterNumber 
                , product_id: productId
                , type: type
                , amount: amount
                , pin: pin
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${MERRYBILL_API_KEY}`,
                },
            }
        );

        const responseData = response.data; // Make sure to access response data properly

        console.log('Service resp', responseData);
        
        return responseData.data;
    } catch (error) {
        console.error("Error purchasing electricity token:", error?.response?.data?.message);
        throw new Error(error?.response?.data?.message);
    }
}



module.exports = {
    purchaseElectricToken
};
