const axios = require('axios');
const DataPlan = require('../models/dataPlansModel'); // Import the DataPlan model

const DATAHOUSE_API_URL = process.env.DATAHOUSE_PLAN_URL;
const DATAHOUSE_API_KEY = process.env.DATAHOUSE_API_KEY;
const HALF_PROFIT = 10;
const FULL_PROFIT = 20;

// Function to fetch and save plans
async function fetchAndSaveDataPlans() {
  try {
    // Fetch plans from DataHouse API
    const response = await axios.get(`${DATAHOUSE_API_URL}`, {
      headers: {
        Authorization: `Token ${DATAHOUSE_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const plans = response.data;

    // Helper function to calculate additional amount based on data size
    const calculateAdditionalAmount = (planSize) => {
      const dataSizeInMB = planSize.includes('GB') ? parseFloat(planSize) * 1000 : parseFloat(planSize);
      return Math.max(Math.ceil(dataSizeInMB / 500) * HALF_PROFIT, 10);
    };

    // Collect all plans from all providers
    const allPlans = [];

    for (const network in plans) {
      const providerPlans = plans[network].map(plan => {
        const additionalAmount = calculateAdditionalAmount(plan.plan);
        return {
          planId: plan.dataplan_id,
          network: plan.network,
          planName: `${plan.plan_network} ${plan.plan}`,
          originalPrice: parseInt(plan.plan_amount, 10),
          improvedPrice: parseInt(plan.plan_amount, 10) + additionalAmount,
          dataSize: plan.plan,
          type: plan.plan_type,
          validity: plan.month_validate,
          description: `${plan.plan_network} ${plan.plan} ${plan.month_validate}`,
        };
      });

      allPlans.push({
        provider: network,
        plans: providerPlans,
      });
    }

    // Save all plans in a single document
    const updatedData = {
      provider: 'ALL_PROVIDERS', 

      allPlans: allPlans, 
    };

    await DataPlan.findOneAndUpdate(
      { provider: 'ALL_PROVIDERS' },
      { $set: updatedData }, 
      { upsert: true, new: true }
    );

    console.log('All data plans updated successfully in a single document.', updatedData);
    return updatedData;
  } catch (error) {
    console.error('Error fetching data plans:', error.message);
  }
}

// Call the function to fetch and save plans
// fetchAndSaveDataPlans(); // Ensure this line is not commented out

module.exports = {
  fetchAndSaveDataPlans,
};
