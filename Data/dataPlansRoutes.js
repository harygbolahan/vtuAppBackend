const express = require('express');
const dataPlanController = require('./dataPlanController')
const authMiddleware = require('../Auth/authMiddleware')
const router = express.Router();

router.route('/').get(dataPlanController.getAllPlans);

router.route('/add').post(authMiddleware.protectRoute, dataPlanController.addPlan);

router.route('/delete').delete(authMiddleware.protectRoute, dataPlanController.deletePlan);



// router.route('/plans').get( dataPlanController.fetchAllDataPlans);

module.exports = router;