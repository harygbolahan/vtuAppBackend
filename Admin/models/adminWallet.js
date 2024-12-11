//Model for admin crediting and debiting users wallet

const mongoose = require("mongoose");

const adminWalletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  email: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  previousBalance: {
    type: Number,
    required: true,
  },
  newBalance: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model("AdminWallet", adminWalletSchema);

