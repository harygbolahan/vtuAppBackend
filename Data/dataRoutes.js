// routes/dataRoutes.js
const express = require('express');
const dataController = require('./dataController');
const authMiddleware = require('../Auth/authMiddleware'); // Assuming you have an auth middleware

const router = express.Router();

// POST /api/data/purchase - Purchase data route
router.route('/purchase').post(authMiddleware.protectRoute, dataController.purchaseData);

// Get a single data transaction by ID
router.route('/:id').get(authMiddleware.protectRoute, dataController.getDataTransactionById);

router.route('/status/:jobId').get(authMiddleware.protectRoute, dataController.getStatus)

// Get all data transactions
router.route('/').get(authMiddleware.protectRoute, dataController.getAllDataTransactions);

// Get all data transactions by a specific user
router.route('/user/:id').get(authMiddleware.protectRoute, dataController.getDataTransactionsByUser);

// Refund a single data transaction by ID
router.route('/refund/:id').post(authMiddleware.protectRoute, dataController.refundSingleDataTransaction)

// Refund multiple data transactions
router.route('/refund').post(authMiddleware.protectRoute, dataController.refundMultipleDataTransactions);

module.exports = router;
