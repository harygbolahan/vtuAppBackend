const axios = require('axios');
const CablePlan = require('./cablePlanModel');

const AUTO_PILOT_URL = process.env.AUTO_PILOT_URL;
AUTO_PILOT_API_KEY = process.env.AUTO_PILOT_API_KEY;

// Get all cable plans

const payload = {
    cableType: "SHOWMAX",
}

const getAndSaveCablePlans = async () => {
    try {
      const response = await axios.post(`${AUTO_PILOT_URL}/v1/load/cable-packages`, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AUTO_PILOT_API_KEY}`
        },
      });
  
      const { data } = response.data;

      console.log("Data", data);
      
  
      // Check if data and data.product exist
      if (data && data.product) {
        const cablePlans = data.product;
  
        // Iterate over each cable plan and save it to the database
        for (const plan of cablePlans) {
          const { 
            planName, 
            planId, 
            description, 
            type, 
            multichoicePrice, 
            multichoiceStatus, 
            ourPrice, 
            ourStatus 
          } = plan;
  
          // Create a new CablePlan entry in the database
          await CablePlan.create({
            planName,
            planId,
            planDescription: description,
            planType: type,
            multiChoicePrice: multichoicePrice,
            multiChoiceStatus: multichoiceStatus,
            ourPrice,
            ourStatus,
            createdAt: new Date(),
          });
        }
  
        console.log('Cable plans have been successfully saved to the database.');
        return cablePlans;
      } else {
        console.error('No cable plans found in the response.');
      }
    } catch (error) {
      console.error('Error fetching or saving cable plans:', error);
    }
  };

  module.exports = { getAndSaveCablePlans };
  