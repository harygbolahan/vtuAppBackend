const express = require('express');
const { createVirtualAccount, bvnDetails, ninDetails } = require('./monnifyControllers');

const router = express.Router();

// Endpoint to reserve a customer account
router.post('/reserve-account', createVirtualAccount);

router.route('/bvn-details').post(bvnDetails);

router.route('/nin-details').post(ninDetails);


module.exports = router;
