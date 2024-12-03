const express = require("express");
const userController = require("./userController");
const authMiddleware = require("../Auth/authMiddleware");
const { imageUploads } = require("../utils/multer");

const router = express.Router();

router.route("/").get(authMiddleware.protectRoute, authMiddleware.verifyIsAdmin, userController.getAllUsers);

router
  .route("/profile")
  .get(authMiddleware.protectRoute, userController.getUserProfile)
  .patch(authMiddleware.protectRoute, userController.updateProfile);

// router.route("/profile/:id").patch(authMiddleware.protectRoute, userController.updateProfile)
router
  .route("/update-picture")
  .patch(
    authMiddleware.protectRoute,
    imageUploads,
    userController.updateProfilePicture
  );

router.route("/status/:id").patch(authMiddleware.protectRoute, authMiddleware.verifyIsAdmin, userController.updateUserStatus);

router.route("/set-password/:id").patch(authMiddleware.protectRoute, authMiddleware.verifyIsAdmin, userController.setUserPassword);

router.route("/email/:email").get(userController.getUserByEmail);

router.route("/update-users/:id").patch(authMiddleware.protectRoute, userController.updateAllUserData);

router.route("/wallet").get(authMiddleware.protectRoute, authMiddleware.verifyIsAdmin, userController.getTotalUserWallet);

router.route("/verified-unverified").get(authMiddleware.protectRoute, authMiddleware.verifyIsAdmin, userController.getTotalVerifiedAndUnverifiedUsers);


module.exports = router;
