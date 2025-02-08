const DataPlan = require('./dataPlansModel');
const dataPlanService = require('./dataPlanService');

const addPlan = async (req, res) => {
    try {
      const { network, planName, dataSize, type, validity, description, providers, userPrice, resellerPrice, agentPrice, apiPrice } = req.body;
  
      // Check if the plan already exists
      let plan = await DataPlan.findOne({ network, planName });
  
      if (plan) {
        // Update existing plan
        plan.dataSize = dataSize;
        plan.type = type;
        plan.validity = validity;
        plan.description = description;
        plan.providers = providers;
        plan.userPrice = userPrice;
        plan.resellerPrice = resellerPrice;
        plan.agentPrice = agentPrice;
        plan.apiPrice = apiPrice;
      } else {
        // Create a new plan
        plan = new DataPlan({
          network,
          planName,
          dataSize,
          type,
          validity,
          description,
          providers,
          userPrice,
          resellerPrice,
          agentPrice,
          apiPrice,
        });
      }
  
      await plan.save();
      res.status(201).json({ message: "Plan saved successfully", plan });
    } catch (error) {
      res.status(500).json({ message: "Error saving plan", error: error.message });
    }
  };

  const editPlan = async (req, res) => {
    try {
      const { planId } = req.params; // Plan ID to update
      const updates = req.body; // Fields to update
  
      // Find the plan by ID
      const plan = await DataPlan.findById(planId);
  
      if (!plan) {
        return res.status(404).json({ message: "Plan not found" });
      }
  
      // Update the plan with provided fields
      Object.keys(updates).forEach((key) => {
        plan[key] = updates[key];
      });
  
      await plan.save();
      res.status(200).json({ message: "Plan updated successfully", plan });
    } catch (error) {
      res.status(500).json({ message: "Error updating plan", error: error.message });
    }
  };

  const getAllPlans = async (req, res) => {
    try {
      const { network, provider, dataSize } = req.query;
  
      // Build query based on filters
      const query = {};
      if (network) query.network = network;
      if (provider) query["providers.provider"] = provider;
      if (dataSize) query["dataSize.value"] = dataSize;
  
      // Fetch plans
      const plans = await DataPlan.find(query);
  
      res.status(200).json({ message: "Plans fetched successfully", plans });
    } catch (error) {
      res.status(500).json({ message: "Error fetching plans", error: error.message });
    }
  };

  const deletePlan = async (req, res) => {
    try {
      console.log('Req', req);
    
      const { planId } = req.body;
  
      // Find and delete the plan
      const plan = await DataPlan.findByIdAndDelete(planId);
  
      if (!plan) {
        return res.status(404).json({ message: "Plan not found" });
      }
  
      res.status(200).json({ message: "Plan deleted successfully", plan });
    } catch (error) {
      res.status(500).json({ message: "Error deleting plan", error: error.message });
    }
  };

  const getPlanById = async (req, res) => {
    try {
      const { planId } = req.params;
  
      // Find the plan by ID
      const plan = await DataPlan.findById(planId);
  
      if (!plan) {
        return res.status(404).json({ message: "Plan not found" });
      }
  
      res.status(200).json({ message: "Plan fetched successfully", plan });
    } catch (error) {
      res.status(500).json({ message: "Error fetching plan", error: error.message });
    }
  };

  const searchPlans = async (req, res) => {
    try {
      const { query } = req.query;
  
      // Search plans by name, network, or description
      const plans = await DataPlan.find({
        $or: [
          { planName: { $regex: query, $options: "i" } },
          { network: { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" } },
        ],
      });
  
      res.status(200).json({ message: "Search results fetched successfully", plans });
    } catch (error) {
      res.status(500).json({ message: "Error searching plans", error: error.message });
    }
  };

  const bulkAddPlans = async (req, res) => {
    try {
      const { plans } = req.body; // Array of plans to add
  
      // Insert multiple plans
      const result = await DataPlan.insertMany(plans);
  
      res.status(201).json({ message: "Plans added successfully", result });
    } catch (error) {
      res.status(500).json({ message: "Error adding plans", error: error.message });
    }
  };

  const getPlansByProvider = async (req, res) => {
    try {
      const { provider } = req.params;
  
      // Find plans by provider
      const plans = await DataPlan.find({ "providers.provider": provider });
  
      res.status(200).json({ message: "Plans fetched successfully", plans });
    } catch (error) {
      res.status(500).json({ message: "Error fetching plans", error: error.message });
    }
  };

  const getPlansByNetworkAndType = async (req, res) => {
    try {
      const { network, type } = req.params;
  
      // Find plans by network and type
      const plans = await DataPlan.find({ network, type });
  
      res.status(200).json({ message: "Plans fetched successfully", plans });
    } catch (error) {
      res.status(500).json({ message: "Error fetching plans", error: error.message });
    }
  };

  const deletePlansByProvider = async (req, res) => {
    try {
      const { provider } = req.params;
  
      // Delete plans by provider
      const result = await DataPlan.deleteMany({ "providers.provider": provider });
  
      res.status(200).json({ message: "Plans deleted successfully", result });
    } catch (error) {
      res.status(500).json({ message: "Error deleting plans", error: error.message });
    }
  };

module.exports = {
    addPlan,
    editPlan,
    getAllPlans,
    deletePlan,
    getPlanById,
    searchPlans,
    bulkAddPlans,
    getPlansByProvider,
    getPlansByNetworkAndType,
    deletePlansByProvider,
}