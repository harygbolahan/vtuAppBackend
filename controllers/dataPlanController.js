const DataPlan = require('../models/dataPlansModel');
const dataPlanService = require('../services/dataPlanService');

const fetchAllDataPlans = async (req, res) => {
    try {
      const dataPlans = await dataPlanService.fetchAndSaveDataPlans();
      console.log(dataPlans);
      
      res.status(200).json({ dataPlans });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch data plans', error: error.message });
    }
}

const getAllDataPlans = async (req, res) => {
    try {
      const dataPlans = await DataPlan.find()

      res.status(200).json({ dataPlans });

      console.log('DataPlans', dataPlans);
      
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch data plans', error: error.message });
    }
}
  
  
module.exports = {
    fetchAllDataPlans,
    getAllDataPlans
}