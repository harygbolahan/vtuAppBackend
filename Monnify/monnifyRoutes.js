const express = require('express');
const { createVirtualAccount, bvnDetails, ninDetails } = require('./monnifyControllers');
const authMiddleware = require('../Auth/authMiddleware');

const router = express.Router();

router.route('/reserve-account').post(authMiddleware.protectRoute, createVirtualAccount)

router.route('/bvn-details').post(authMiddleware.protectRoute, bvnDetails);

router.route('/nin-details').post(authMiddleware.protectRoute, ninDetails);


module.exports = router;
