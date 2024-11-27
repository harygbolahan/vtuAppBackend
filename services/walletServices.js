// services/walletService.js
const mongoose = require("mongoose");
const Users = require("../User/userModels");
const Wallet = require("../models/walletModel"); // Assume a Wallet model

exports.getUserWallet = async (userId) => {
  try {
      const user = await Users.findById(userId);
      if (!user) {
          throw new Error("User not found");
      }
      return user;
  } catch (error) {
      console.error("Error fetching user wallet:", error);
      throw new Error("Unable to retrieve user wallet");
  }
};

exports.deductAmount = async (userId, amount) => {
  try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
          throw new Error("Invalid user ID");
      }

      const wallet = await Users.findById(userId);
      if (!wallet) {
          throw new Error("Wallet not found");
      }

      if (wallet.walletBalance < amount) {
          throw new Error("Insufficient balance");
      }

      // Deduct the amount and save
      wallet.walletBalance -= amount;
      await wallet.save();

      // Return the updated wallet data
      return wallet;
  } catch (error) {
      console.error("Deduction error:", error.message);
      throw new Error(`Data purchase failed; deduction could not be processed. ${error.message}`);
  }
};

exports.refundAmount = async (userId, amount) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error("Invalid user ID");
      }

      console.log(userId, 'userId');
      
      const wallet = await Users.findById(userId); // Use userId directly
  
      if (!wallet) {
        throw new Error("Wallet not found"); // Handle if wallet is not found
      }
      
  
      // ... rest of the refund logic
      wallet.walletBalance = +amount + wallet.walletBalance
      await wallet.save();

    } catch (error) {
      console.error("Refund error:", error.message);
      throw new Error("Data purchase failed; refund could not be processed.");
    }
  };


exports.fundAmount = async (userId, amount) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error("Invalid user ID");
      }

      const wallet = await Users.findById(userId); // Use userId directly

      if (!wallet) {
        throw new Error("Wallet not found"); // Handle if wallet is not found
      }

      // ... rest of the fund logic
      wallet.walletBalance = +amount + wallet.walletBalance 
      await wallet.save();

    } catch (error) {
      console.error("Fund error:", error.message);
      throw new Error("Wallet Funding could not be processed.");
    }
    
}

