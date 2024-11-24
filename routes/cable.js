const express = require('express');
const cableController = require('../controllers/cableController')
const authMiddleware = require('../middleware/auth')
const router = express.Router();

router.route('/verify-iuc').post(authMiddleware.protectRoute, cableController.verifyCableIUC)

router.route('/purchase-cable').post(authMiddleware.protectRoute, cableController.purchaseCable)

router.route('/user/transactions').get(authMiddleware.protectRoute, cableController.getAllCableTransactionsByUser)

router.route('/transactions/:id').get(authMiddleware.protectRoute, cableController.getCableTransactionById)

router.route('/transactions').get(authMiddleware.protectRoute, cableController.getAllCableTransactions)

router.route('/transactions/:id').patch(authMiddleware.protectRoute, cableController.refundSingleCableTransaction)

router.route('/transactions').patch(authMiddleware.protectRoute, cableController.refundMultipleCableTransactions)



module.exports = router;