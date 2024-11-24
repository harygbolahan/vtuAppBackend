const express = require('express');
const dataPlanController = require('../controllers/dataPlanController')
const authMiddleware = require('../middleware/auth')
const router = express.Router();

router.route('/').get(authMiddleware.protectRoute, dataPlanController.fetchAllDataPlans);

router.route('/plans').get( dataPlanController.fetchAllDataPlans);

module.exports = router;