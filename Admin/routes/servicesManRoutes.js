const express = require('express');
const authMiddleware = require("../middlewares/adminAuthMiddleware")
const servicesController = require("../controllers/servicesManController")


const router = express.Router();

router.route('/setGeneralStatus').put(authMiddleware.protectRoute, authMiddleware.verifyIsAdmin, servicesController.setGeneralStatus)

router.route('/setNetworkStatus').put(authMiddleware.protectRoute, authMiddleware.verifyIsAdmin, servicesController.setNetworkStatus)

router.route('/setNetworkTypeStatus').put(authMiddleware.protectRoute, authMiddleware.verifyIsAdmin, servicesController.setNetworkTypeStatus)

// Route to set general status
// router.put('/general-status', setGeneralStatus);

// Route to set network status
// router.put('/network-status', setNetworkStatus);

// // Route to set network type status
// router.put('/network-type-status', setNetworkTypeStatus);

module.exports = router;
