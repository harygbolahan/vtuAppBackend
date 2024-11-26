const express = require('express');
const airtimeController = require('./airtimeController')
const authMiddleware = require('../Auth/authMiddleware')
const router = express.Router();

router.route('/purchase').post(authMiddleware.protectRoute, airtimeController.purchaseAirtime)

router.route('/:id').get(authMiddleware.protectRoute, airtimeController.getAirtimeTransactionById)

router.route('/user/:id').get(authMiddleware.protectRoute, airtimeController.getAirtimeTransactionsByUserId)

router.route('/').get(authMiddleware.protectRoute, airtimeController.getAllAirtimeTransactions)

router.route('/refund/:id').post(authMiddleware.protectRoute, airtimeController.refundSingleAirtimeTransaction)

router.route('/refund').post(authMiddleware.protectRoute, airtimeController.refundMultipleAirtimeTransactions)



module.exports = router;