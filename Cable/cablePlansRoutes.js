const express = require('express');
const cablePlanController = require('./cablePlanController');
const authMiddleware = require('../Auth/authMiddleware');
const router = express.Router();

router.route('/').get( authMiddleware.protectRoute, cablePlanController.getAllCablePlans);

router.route('/fetch').get( cablePlanController.fetchAllCablePlans);

module.exports = router;
