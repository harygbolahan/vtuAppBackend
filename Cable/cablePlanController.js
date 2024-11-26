const CablePlan = require('./cablePlanModel');
const cableplanService = require('./cablePlanService');

// Get all cable plans
const getAllCablePlans = async (req, res) => {
  try {
    const cablePlans = await cableplanService.getAndSaveCablePlans();
    res.status(200).json(cablePlans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const fetchAllCablePlans = async (req, res) => {
  try {
    const cablePlans = await CablePlan.find();
    res.status(200).json(cablePlans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getAllCablePlans,
  fetchAllCablePlans
}

