const express = require('express');
const cablePlanController = require('../controllers/cablePlanController');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

router.route('/').get( authMiddleware.protectRoute, cablePlanController.getAllCablePlans);

router.route('/fetch').get( cablePlanController.fetchAllCablePlans);

module.exports = router;
