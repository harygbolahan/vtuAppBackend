const express = require('express');
const electricDiscoController = require('./electricDiscoController');
const electricController = require('./electricController')
const authMiddleware = require('../Auth/authMiddleware');
const router = express.Router();

router.route('/').post(electricDiscoController.fetchAllElectricDisco);

router.route('/').get(electricDiscoController.getAllElectricDisco);

router.route('/validateMeter').post(authMiddleware.protectRoute, electricDiscoController.validateElectricMeter);

router.route('/purchase').post(authMiddleware.protectRoute, electricController.purchaseElectricToken)

module.exports = router;