const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    transactionId: {
      type: String,
    //   unique: true,
      required: true,
      default: () => `TXN-${Date.now()}`,
    },
    serviceType: {
      type: String,
      required: true,
      enum: ["Data", "Airtime", "Cable", "Electricity", "Payment", "Refund"],
    },
    description: {
        type: String,
    },
    amount: {
      type: Number,
      required: true,
      min: [0, "Amount cannot be negative"],
    },
    phoneNumber: {
      type: String,
      required: function () {
        return ["Data", "Airtime"].includes(this.serviceType); // Required for Data and Airtime
      },
      validate: {
        validator: function (v) {
          return /^(0)\d{10}$/.test(v);
        },
        message: "Invalid phone number",
      },
    },
    type: {
      type: String,
      required: function () {
        return ["Data"].includes(this.serviceType); // Required for Data transactions
      },
      enum: ["SME", "Corporate Gifting", "Awoof Gifting", "SME2", "GIFTING", "CORPORATE", "VTU"],
    },
    user:{
      
    },
    token: {
      type: String,
      required: function () {
        return ["Electricity"].includes(this.serviceType); // Required for Electricity transactions
      },
    },
    iucNumber: {
      type: String,
      required: function () {
        return ["Cable"].includes(this.serviceType); // Required for Cable transactions
      },
    },
    discoType: {
      type: String,
      required: function () {
        return ["Electricity"].includes(this.serviceType); // Required for Electricity
      },
    },
    status: {
      type: String,
      enum: ["initialised", "pending", "success", "failed", "Refund"],
      default: "initialised",
    },
    previousBalance: {
      type: Number,
    },
    newBalance: {
      type: Number,
    },
    response: {
      type: String,
      default: null,
    },
    externalTransactionId: {
      type: String,
      default: null,
    },
    details: {
      type: mongoose.Schema.Types.Mixed, // Flexible field for additional service-specific data
      default: {},
    },
    initiatedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: Date,
    failedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
transactionSchema.index({ userID: 1, status: 1 });
transactionSchema.index({ serviceType: 1 });

// Middleware for status-based timestamp updates
transactionSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    if (this.status === "success") this.completedAt = new Date();
    else if (this.status === "failed") this.failedAt = new Date();
  }
  next();
});

module.exports = mongoose.model("Transaction", transactionSchema);
