const mongoose = require("mongoose");

// Schema for provider-specific details
const providerDetailsSchema = new mongoose.Schema({
  provider: {
    type: String,
    required: true,
    enum: ["autoPilot", "ogdams", "datahouse", "bwsub", "husmo", "ayinlak", "gladtidings"],
  },
  providerPrice: {
    type: mongoose.Schema.Types.Decimal128,
    required: true,
  },
  providerPlanId: {
    type: String,
    required: true,
  },
});

// Main Data Plan Schema
const dataPlanSchema = new mongoose.Schema(
  {
    network: {
      type: String,
      required: true,
      enum: ["MTN", "AIRTEL", "GLO", "9MOBILE"],
    },
    planName: {
      type: String,
      required: true,
    },
    dataSize: {
      value: { type: Number, required: true }, // e.g., 1
      unit: { type: String, required: true, enum: ["MB", "GB", "TB"] }, // e.g., "GB"
    },
    type: {
      type: String,
      enum: ["SME", "CORPORATE", "GIFTING"],
    },
    validity: {
      value: { type: Number, required: true }, // e.g., 30
      unit: { type: String, required: true, enum: ["hours", "days", "weeks"] }, // e.g., "days"
    },
    description: {
      type: String,
    },
    providers: [providerDetailsSchema], // Array of provider-specific details
    userPrice: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
    },
    resellerPrice: mongoose.Schema.Types.Decimal128,
    agentPrice: mongoose.Schema.Types.Decimal128,
    apiPrice: mongoose.Schema.Types.Decimal128,
  },
  { timestamps: true }
);

// Indexes for faster queries
dataPlanSchema.index({ network: 1, planName: 1 }); 
dataPlanSchema.index({ "providers.provider": 1 }); 

// Hide internal fields in API responses
dataPlanSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.providers = ret.providers.map((provider) => ({
      provider: provider.provider,
      providerPrice: provider.providerPrice.toString(), // Convert Decimal128 to string
      providerPlanId: provider.providerPlanId,
    }));
    return ret;
  },
});

const DataPlan = mongoose.model("DataPlan", dataPlanSchema);

module.exports = DataPlan;