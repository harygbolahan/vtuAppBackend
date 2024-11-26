const express = require('express');
const dataPlanController = require('./dataPlanController')
const authMiddleware = require('../Auth/authMiddleware')
const router = express.Router();

router.route('/').get(authMiddleware.protectRoute, dataPlanController.fetchAllDataPlans);

router.route('/plans').get( dataPlanController.fetchAllDataPlans);

module.exports = router;