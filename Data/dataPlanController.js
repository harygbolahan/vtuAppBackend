const DataPlan = require('./dataPlansModel');
const dataPlanService = require('./dataPlanService');

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

const editPlan = async (req, res) => {
    try {
      const { id } = req.params;
      const { network, planName, originalPrice, improvedPrice, dataSize, type, validity, description} = req.body;
  
      const updatedPlan = await DataPlan.findByIdAndUpdate(
        id,
        { name, description, price, dataLimit },
        { new: true }
      );
  
      res.status(200).json({ updatedPlan });

    } catch (error) {
      res.status(500).json({ message: 'Failed to update data plan', error: error.message });
    }

}

const deletePlan = async (req, res) => {
    try {
      const { id } = req.params;

      const deletedPlan = await DataPlan.findByIdAndDelete(id);

      res.status(200).json({ deletedPlan });

    } catch (error) {
      res.status(500).json({ message: 'Failed to delete data plan', error: error.message });
    }

}
  
  
module.exports = {
    fetchAllDataPlans,
    getAllDataPlans
}