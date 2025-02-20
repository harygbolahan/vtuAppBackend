const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // Each user has one wallet
    },
    balance: {
      type: Number,
      default: 0,
      min: [0, "Balance cannot be negative"],
    },
    locked: {
      type: Boolean,
      default: false, // Can lock wallet to prevent transactions
    },
    transactionHistory: [
      {
        transactionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Transaction",
        },
        type: {
          type: String,
          enum: ["credit", "debit"], // Transaction type
        },
        amount: {
          type: Number,
          required: true,
        },
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

// Index userId for efficient querying
// walletSchema.index({ userId: 1 });

// Instance method to credit wallet
walletSchema.methods.credit = async function (amount) {
  if (amount <= 0) throw new Error("Credit amount must be positive");
  this.balance += amount;
  this.transactionHistory.push({
    transactionId: new mongoose.Types.ObjectId(), // Placeholder, link to actual transaction if needed
    type: "credit",
    amount,
  });
  await this.save();
  return this.balance;
};

// Instance method to debit wallet
walletSchema.methods.debit = async function (amount) {
  if (amount <= 0) throw new Error("Debit amount must be positive");
  if (this.locked) throw new Error("Wallet is locked");
  if (this.balance < amount) throw new Error("Insufficient balance");

  this.balance -= amount;
  this.transactionHistory.push({
    transactionId: new mongoose.Types.ObjectId(), // Placeholder, link to actual transaction if needed
    type: "debit",
    amount,
  });
  await this.save();
  return this.balance;
};

// Static method to lock wallet
walletSchema.statics.lockWallet = async function (userId) {
  const wallet = await this.findOne({ userId });
  if (!wallet) throw new Error("Wallet not found");
  wallet.locked = true;
  await wallet.save();
};

// Static method to unlock wallet
walletSchema.statics.unlockWallet = async function (userId) {
  const wallet = await this.findOne({ userId });
  if (!wallet) throw new Error("Wallet not found");
  wallet.locked = false;
  await wallet.save();
};

module.exports = mongoose.model("Wallet", walletSchema);
