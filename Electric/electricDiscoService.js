const axios = require("axios");

const ElectricDisco = require("./electricDiscoModel");

const MERRYBILL_URL = process.env.MERRYBILL_URL;
const MERRYBILL_API_KEY = process.env.MERRYBILL_API_KEY;

const getAndSaveElectricDisco = async () => {
    try {
        const response = await axios.get(`${MERRYBILL_URL}/electricity`, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${MERRYBILL_API_KEY}`,
            },
        });

        const electricDiscoData = response.data.data.category;

        console.log("Electric data", electricDiscoData);

        // Transform the product data to match your schema
        const transformedData = {
            category_name: electricDiscoData.category_name,
            category_type: electricDiscoData.category_type,
            products: electricDiscoData.products.map((product) => ({
                discoName: product.product_name,
                discoId: product.product_id,
                discoCode: product.product_code,
                minAmount: product.min_amount,
                maxAmount: product.max_amount,
                convenienceFee: product.convenience_fee,
                variations: product.variations,
            })),
        };

        // Save to the database as a single document
        const savedData = await ElectricDisco.findOneAndUpdate(
            { category_name: transformedData.category_name }, // Filter to prevent duplicate categories
            transformedData, // New data to save
            { upsert: true, new: true } // Options: create new if not found, return the updated document
        );

        console.log("Saved Electric Disco Data:", savedData);

        return savedData;
    } catch (error) {
        console.error("Error saving Electric Disco data:", error);
        throw error;
    }
};



const validateElectricMeter = async ({ productId, meterNumber, type }) => {
    try {
        console.log('Service parameters:', { productId, meterNumber, type }); // Log incoming parameters

        if (!productId || !meterNumber || !type) {
            throw new Error("Missing required parameters");
        }

        const payload = {
            meter_number: meterNumber,
            product_id: productId,
            type: type
        };

        console.log('Payload:', payload);
        
        const response = await axios.post(
            `${MERRYBILL_URL}/validate/electricity`, payload,
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${MERRYBILL_API_KEY}`,
                },
            }
        );

        const responseData = response.data; // Make sure to access response data properly
        return responseData;
    } catch (error) {
        console.error("Error validating meter number:", error?.response?.data?.message);
        throw new Error(error?.response?.data?.message);
    }
}



module.exports = {
    getAndSaveElectricDisco,
    validateElectricMeter
};
