const express = require('express');
const { createVirtualAccount, bvnDetails, ninDetails } = require('./monnifyControllers');
const authMiddleware = require('../Auth/authMiddleware');

const router = express.Router();

// Endpoint to reserve a customer account
router.post('/reserve-account', createVirtualAccount);

router.route('/bvn-details').post(authMiddleware.protectRoute, bvnDetails);

router.route('/nin-details').post(authMiddleware.protectRoute, ninDetails);


module.exports = router;
