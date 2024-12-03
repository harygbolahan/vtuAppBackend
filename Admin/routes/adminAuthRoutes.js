const express = require("express");

const authController = require("../controllers/adminAuthController");

const router = express.Router();

router.route("/adminlogin").post(authController.adminLogin);


router.route("/register").post(authController.signup);

router
  .route("/verify/:email/:verificationToken")
  .get(authController.verifyEmailAddress);

router.route("/forgot-password").post(authController.forgotPassword);

router
  .route("/resetPassword/:email/:resetToken")
  .patch(authController.resetPassword);

router.route("/change-password").patch(authController.changePassword);

router.route("/set-pin").patch(authController.setTransactionPin);

router.route("/reset-pin").patch(authController.resetTransactionPin);

router.route("/change-pin").patch(authController.changeTransactionPin);

module.exports = router;