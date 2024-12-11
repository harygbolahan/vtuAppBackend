const express = require("express");

const authMiddleware = require("../middlewares/adminAuthMiddleware");
const walletController = require("../controllers/adminWalletControllers");


const router = express.Router();

router.route('/creditDebitUser').post(authMiddleware.protectRoute, authMiddleware.verifyIsAdmin, walletController.creditDebitUserWallet )


router.route('/getAllTransactions').get(authMiddleware.protectRoute, authMiddleware.verifyIsAdmin, walletController.getAllTransactions)

router.route('/refundTransaction').post(authMiddleware.protectRoute, authMiddleware.verifyIsAdmin, walletController.refundTransaction)


module.exports = router;