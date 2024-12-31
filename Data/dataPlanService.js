const axios = require("axios");
const DataPlan = require("./dataPlansModel"); // Import the DataPlan model

const DATAHOUSE_API_URL = process.env.DATAHOUSE_PLAN_URL;
const DATAHOUSE_API_KEY = process.env.DATAHOUSE_API_KEY;
const AUTO_PILOT_API_URL = process.env.AUTO_PILOT_URL;
const AUTO_PILOT_API_KEY = process.env.AUTO_PILOT_API_KEY;
const HALF_PROFIT = 10;
const FULL_PROFIT = 20;

// Function to fetch and save plans
// async function fetchAndSaveDataPlans() {
//   try {
//     // Fetch plans from DataHouse API
//     const response = await axios.get(`${DATAHOUSE_API_URL}`, {
//       headers: {
//         Authorization: `Token ${DATAHOUSE_API_KEY}`,
//         "Content-Type": "application/json",
//       },
//     });

//     const plans = response.data;

//     // Helper function to calculate additional amount based on data size
//     const calculateAdditionalAmount = (planSize) => {
//       const dataSizeInMB = planSize.includes("GB")
//         ? parseFloat(planSize) * 1000
//         : parseFloat(planSize);
//       return Math.max(Math.ceil(dataSizeInMB / 500) * HALF_PROFIT, 10);
//     };

//     // Collect all plans from all providers
//     const allPlans = [];

//     for (const network in plans) {
//       const providerPlans = plans[network].map((plan) => {
//         const additionalAmount = calculateAdditionalAmount(plan.plan);
//         return {
//           planId: plan.dataplan_id,
//           network: plan.network,
//           planName: `${plan.plan_network} ${plan.plan}`,
//           originalPrice: parseInt(plan.plan_amount, 10),
//           improvedPrice: parseInt(plan.plan_amount, 10) + additionalAmount,
//           dataSize: plan.plan,
//           type: plan.plan_type,
//           validity: plan.month_validate,
//           description: `${plan.plan_network} ${plan.plan} ${plan.month_validate}`,
//         };
//       });

//       allPlans.push({
//         provider: network,
//         plans: providerPlans,
//       });
//     }

//     // Save all plans in a single document
//     const updatedData = {
//       provider: "ALL_PROVIDERS",

//       allPlans: allPlans,
//     };

//     await DataPlan.findOneAndUpdate(
//       { provider: "ALL_PROVIDERS" },
//       { $set: updatedData },
//       { upsert: true, new: true }
//     );

//     console.log(
//       "All data plans updated successfully in a single document.",
//       updatedData
//     );
//     return updatedData;
//   } catch (error) {
//     console.error("Error fetching data plans:", error.message);
//   }
// }

async function fetchAndSaveAutoPilotPlans() {
  try {
    // Define the network IDs and their respective names
    const networkMap = {
      1: "MTN",
      2: "Airtel",
      3: "Glo",
      4: "9mobile",
    };

    const dataTypes = [
      "SME",
      "CORPORATE GIFTING",
      "AWOOF GIFTING",
      "DIRECT GIFTING",
      "CORPORATE GIFTING LITE",
    ];

    const allPlans = [];

    // Iterate over network IDs and data types
    for (const [networkId, networkName] of Object.entries(networkMap)) {
      for (const dataType of dataTypes) {
        try {
          const data = {
            networkId: String(networkId),
            dataType,
          };

          // Fetch data from AutoPilot API
          const response = await axios.post(
            `${AUTO_PILOT_API_URL}/v1/load/data`,
            data,
            {
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${AUTO_PILOT_API_KEY}`,
              },
            }
          );

          // Check if the response contains valid plans
          if (response.data?.data?.product?.length > 0) {
            console.log(`Fetched plans for ${networkName}, dataType: ${dataType}`);
            allPlans.push({
              networkId,
              networkName,
              dataType,
              plans: response.data.data.product,
            });
          } else {
            console.log(`No plans found for ${networkName}, dataType: ${dataType}`);
          }
        } catch (innerError) {
          console.warn(`Failed to fetch plans for ${networkName}, dataType: ${dataType}`);
          console.warn(`Error: ${innerError.message}`);
          continue; // Skip to the next iteration
        }
      }
    }

    // Flatten the list of plans and pass them to the update function
    const flatPlans = allPlans.flatMap(planSet => {
      return planSet.plans.map(plan => ({
        ...plan,
        networkName: planSet.networkName,
        networkId: planSet.networkId,
      }));
    });

    // console.log('Flatplans', flatPlans);
    

    updatePlansWithAutoPilotData(flatPlans);
    return allPlans;
  } catch (error) {
    console.error("Unexpected error:", error.message);
  }
}

async function updatePlansWithAutoPilotData(plans) {
  try {
      const providerToUpdate = "AutoPilot";

      for (const plan of plans) {
          // Validate the plan data
          if (!plan.planName || !plan.planId || !plan.ourPrice || !plan.bundle || !plan.networkId || !plan.networkName) {
              console.warn(`Skipping invalid plan:`, plan);
              continue;
          }

          const {
              planName,
              planId,
              description,
              Validity: validity,
              type,
              bundle: dataSize,
              ourPrice: providerPrice,
              networkId,
              networkName,
          } = plan;

          let sizeInGB;
          if (dataSize.toLowerCase().endsWith("gb")) {
              sizeInGB = parseFloat(dataSize.toLowerCase().replace("gb", ""));
          } else if (dataSize.toLowerCase().endsWith("mb")) {
              sizeInGB = parseFloat(dataSize.toLowerCase().replace("mb", "")) / 1024;
          } else if (dataSize.toLowerCase().endsWith("tb")) {
              sizeInGB = parseFloat(dataSize.toLowerCase().replace("tb", "")) * 1024;
          } else {
              console.warn(`Invalid dataSize format: ${dataSize} for plan ${planName}`);
              continue;
          }

          const newProviderPrice = parseFloat(providerPrice)

          const userPrice = newProviderPrice + sizeInGB * 20;
          const resellerPrice = newProviderPrice + sizeInGB * 15;
          const agentPrice = newProviderPrice + sizeInGB * 10;
          const apiPrice = newProviderPrice + sizeInGB * 5;

          let existingDocument = await DataPlan.findOne({ provider: providerToUpdate });

          if (!existingDocument) {
              existingDocument = new DataPlan({ provider: providerToUpdate, allPlans: [] });
          }

          const existingPlanIndex = existingDocument.allPlans.findIndex(
              (existingPlan) => existingPlan.autoPilot?.planId === planId
          );

          const newPlanData = {
              autoPilot: { networkId: String(networkId), planId, providerPrice },
              network: networkName,
              planName,
              userPrice: userPrice,
                resellerPrice: resellerPrice,
                agentPrice: agentPrice,
                apiPrice: apiPrice,
                dataSize,
              type,
              validity,
              description,
          };

          if (existingPlanIndex !== -1) {
              existingDocument.allPlans[existingPlanIndex] = newPlanData;
              console.log(`Updating existing plan: ${planName}`);
          } else {
              existingDocument.allPlans.push(newPlanData);
              console.log(`Inserting new plan: ${planName}`);
          }

          await existingDocument.save();
      }

      console.log("Plans updated successfully!");
  } catch (error) {
      console.error("Error updating plans:", error);
  }
}

const fetchAndMergeDataPlans = async () => {
  try {
    console.log("Starting fetch and merge operation...");

    const response = await axios.get(`${DATAHOUSE_API_URL}`, {
      headers: {
        Authorization: `Token ${DATAHOUSE_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    const plans = response.data;
    console.log("Fetched plans from DataHouse API successfully.");

    const allPlans = await DataPlan.findOne({});
    if (!allPlans) {
      throw new Error("No plans found in database");
    }

    // Helper function to standardize strings for comparison
    const standardizeString = (str) => {
      return str.toLowerCase()
               .replace(/\s+/g, '')
               .replace(/[:\-_]/g, '');
    };

    const normalizeDataSize = (size) => {
      if (!size) return "";
      size = size.toLowerCase().trim();
      
      if (size.includes("gb")) {
        const numValue = parseFloat(size.replace("gb", ""));
        return `${Math.floor(numValue)}GB`;
      }
      
      if (size.includes("mb")) {
        const numValue = parseFloat(size.replace("mb", ""));
        return `${Math.floor(numValue)}MB`;
      }
      
      return size.toUpperCase();
    };

    const normalizePlanType = (type) => {
      if (!type) return "";
      
      const typeMap = {
        'CORPORATE': 'CORPORATE',
        'CORPORATE GIFTING LITE': 'CORPORATE LITE',
        'GIFTING': 'DIRECT',
        'SME': 'SME',
        'SPECIAL DATA': 'AWOOF'
      };

      const normalizedType = type.trim().toUpperCase();
      return typeMap[normalizedType] || normalizedType;
    };

    const normalizeNetwork = (network) => {
      if (!network) return "";
      
      const networkMap = {
        'MTN': 'MTN',
        'MTN_PLAN': 'MTN',
        'GLO': 'GLO',
        'GLO_PLAN': 'GLO',
        'AIRTEL': 'AIRTEL',
        'AIRTEL_PLAN': 'AIRTEL',
        '9MOBILE': '9MOBILE',
        '9MOBILE_PLAN': '9MOBILE'
      };

      const normalizedNetwork = network.trim().toUpperCase();
      return networkMap[normalizedNetwork] || normalizedNetwork;
    };

    const normalizeValidity = (validity) => {
      if (!validity) return "";
      validity = validity.toLowerCase().trim();
      
      const validityMap = {
        '1day': '1 day',
        '1month': '30 days',
        'monthly plan': '30 days',
        'monthly plan:': '30 days',
        '3-day plan:': '3 days',
        'daily plan:': '1 day',
        'monthly': '30 days',
        '1 month': '30 days',
        '30days': '30 days',
        '30 day': '30 days',
        'month': '30 days',
        '1 day': '1 day',
        '2 days': '2 days',
        '3 days': '3 days',
        '7 days': '7 days',
        'weekly': '7 days'
      };

      return validityMap[validity] || validity;
    };

    for (const networkKey in plans) {
      const networkPlans = plans[networkKey];
      
      for (const plan of networkPlans) {
        const normalizedSize = normalizeDataSize(plan.plan);
        const normalizedType = normalizePlanType(plan.plan_type);
        const normalizedValidity = normalizeValidity(plan.month_validate);
        const normalizedNetwork = normalizeNetwork(plan.plan_network);

        console.log(`\nProcessing Datahouse plan:`);
        console.log(`- Network: ${normalizedNetwork} (original: ${plan.plan_network})`);
        console.log(`- Size: ${normalizedSize} (original: ${plan.plan})`);
        console.log(`- Type: ${normalizedType} (original: ${plan.plan_type})`);
        console.log(`- Validity: ${normalizedValidity} (original: ${plan.month_validate})`);

        const planData = {
          planId: plan.dataplan_id,
          networkId: plan.network.toString(),
          providerPrice: parseFloat(plan.plan_amount) || 0,
        };

        // More flexible matching logic
        const potentialMatches = allPlans.allPlans.filter(p => {
          const sizeMatch = standardizeString(p.dataSize) === standardizeString(normalizedSize);
          const networkMatch = standardizeString(p.network) === standardizeString(normalizedNetwork);
          return sizeMatch && networkMatch;
        });

        console.log(`\nFound ${potentialMatches.length} potential matches based on size and network.`);

        // Find best match among potential matches
        const existingPlan = potentialMatches.find(p => {
          const typeMatch = standardizeString(p.type) === standardizeString(normalizedType);
          const validityMatch = standardizeString(p.validity) === standardizeString(normalizedValidity);

          // Debug logging
          console.log(`\nChecking potential match (${p.planName}):`);
          console.log(`- Network: ${p.network} (Match: ${standardizeString(p.network) === standardizeString(normalizedNetwork)})`);
          console.log(`- Size: ${p.dataSize} (Match: ${standardizeString(p.dataSize) === standardizeString(normalizedSize)})`);
          console.log(`- Type: ${p.type} (Match: ${standardizeString(p.type) === standardizeString(normalizedType)})`);
          console.log(`- Validity: ${p.validity} (Match: ${standardizeString(p.validity) === standardizeString(normalizedValidity)})`);
          
          return typeMatch && validityMatch;
        });

        if (existingPlan) {
          console.log(`\nMatch found! Updating plan: ${existingPlan.planName}`);
          console.log('Previous datahouse values:', JSON.stringify(existingPlan.datahouse));
          console.log('New datahouse values:', JSON.stringify(planData));

          // Update the datahouse field
          existingPlan.datahouse = planData;
          
          try {
            // Instead of just saving, let's use findOneAndUpdate for atomic operation
            const updateResult = await DataPlan.findOneAndUpdate(
              { 
                _id: allPlans._id,
                'allPlans._id': existingPlan._id 
              },
              { 
                $set: { 
                  'allPlans.$.datahouse': planData 
                } 
              },
              { new: true }
            );

            if (updateResult) {
              // Verify the update
              const verifyPlan = await DataPlan.findOne({
                _id: allPlans._id,
                'allPlans._id': existingPlan._id
              });
              
              const updatedPlan = verifyPlan.allPlans.find(p => 
                p._id.toString() === existingPlan._id.toString()
              );

              if (updatedPlan && 
                  updatedPlan.datahouse.planId === planData.planId &&
                  updatedPlan.datahouse.networkId === planData.networkId &&
                  updatedPlan.datahouse.providerPrice === planData.providerPrice) {
                console.log(`Successfully verified update for plan: ${existingPlan.planName}`);
              } else {
                console.error('Update verification failed. Current values:', JSON.stringify(updatedPlan.datahouse));
              }
            } else {
              console.error(`Failed to update plan: ${existingPlan.planName}`);
              console.error('Update operation returned null or undefined');
            }
          } catch (updateError) {
            console.error(`Error during update operation:`, updateError);
            console.error(`Plan details:`, {
              documentId: allPlans._id,
              planId: existingPlan._id,
              planName: existingPlan.planName
            });
          }
        } else {
          if (potentialMatches.length > 0) {
            console.warn('\nFound size/network matches but type/validity did not match:');
            potentialMatches.forEach(p => {
              console.log(`- ${p.planName} (${p.type}, ${p.validity})`);
            });
          } else {
            console.warn(`\nNo potential matches found for DataHouse plan with above criteria`);
          }
        }
      }
    }

    // Add this to your main function after processing all plans:
await verifyUpdates(allPlans);


    console.log("\nAll DataHouse plans processed successfully.");
    return true;
  } catch (error) {
    console.error("Error fetching and merging DataHouse plans:", error.message);
    throw error;
  }
};

const verifyUpdates = async (allPlans) => {
  try {
    const fullDoc = await DataPlan.findById(allPlans._id);
    console.log('\nFull document state:');
    console.log('Total plans:', fullDoc.allPlans.length);
    console.log('Plans with datahouse field:', 
      fullDoc.allPlans.filter(p => p.datahouse).length
    );
    
    // Log a few specific plans for verification
    const samplePlans = fullDoc.allPlans
      .filter(p => p.datahouse)
      .slice(0, 3);
    
    console.log('\nSample updated plans:');
    samplePlans.forEach(plan => {
      console.log(`- ${plan.planName}:`);
      console.log('  Datahouse:', plan.datahouse);
    });

    return fullDoc;
  } catch (error) {
    console.error('Verification error:', error);
    return null;
  }
};


const fetchAndSaveDataPlans = async () => {
  try {
    const allPlans = await DataPlan.find();
    return allPlans;
  } catch (error) {
    console.error("Error fetching all plans:", error.message);
    throw error;
  }

}


// Call the function to fetch and save plans
// fetchAndSaveDataPlans(); // Ensure this line is not commented out
// fetchAndSaveAutoPilotPlans();
// fetchAndMergeDataPlans()

// getAllPlans()

module.exports = {
  fetchAndSaveDataPlans,
  fetchAndSaveAutoPilotPlans,
  updatePlansWithAutoPilotData
};
