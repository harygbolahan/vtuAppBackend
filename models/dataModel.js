const mongoose = require("mongoose");

const dataSchema = new mongoose.Schema(
  {
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Index for faster lookups
    },
    transactionId: {
      type: String,
      unique: true,
      required: true,
      default: () => `TXN-${Date.now()}`, // Generate unique transaction ID
    },
    network: {
      type: String,
      required: true,
      // enum: ["MTN", "GLO", "AIRTEL", "9MOBILE"],
    },
    description: {
      type: String
    },
    type: {
      type: String,
      required: true,
      enum: ["SME", "Corporate Gifting", "Awoof Gifting", "SME2", 'GIFTING', 'CORPORATE'],
    },
    phoneNumber: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          /^(0)\d{10}$/
        },
        message: "Invalid phone number",
      },
    },
    amount: {
      type: Number,
      required: true,
      min: [0, "Amount cannot be negative"],
    },
    response:{
      type: String,
    },
    externalTransactionId: {
      type: String,
    },
    status: {
      type: String,
      enum: ["initialised", "pending", "success", "failed"],
      default: "initialised",
    },
    previousBalance: {
      type: Number,
    },
    newBalance: {
      type: Number,
    },
    cashBack: {
      type: Number,
      default: 0,
      min: [0, "Cashback cannot be negative"],
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, "Discount cannot be negative"],
    },
    initiatedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: Date,
    failedAt: Date,
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// Indexing to speed up querying by userID and status
dataSchema.index({ userID: 1, status: 1 });

// Static method to find transaction by transactionId
dataSchema.statics.findByTransactionId = async function (transactionId) {
  return await this.findOne({ transactionId });
};

// Middleware for status-based timestamp updates
dataSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    if (this.status === "success") this.completedAt = new Date();
    else if (this.status === "failed") this.failedAt = new Date();
  }
  next();
});

module.exports = mongoose.model("Data", dataSchema);
