const mongoose = require('mongoose');

// Define the schema for a single data plan
const dataPlanSchema = new mongoose.Schema({
  planId: {
    type: String,
    required: true,
  },
  network: {
    type: String,
    required: true,
  },
  planName: {
    type: String,
    required: true,
  },
  originalPrice: {
    type: Number,
    required: true,
  },
  improvedPrice: {
    type: Number,
    required: true,
  },
  dataSize: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  validity: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  }
});

// Define the schema for a collection of data plans grouped by provider
const providerPlansSchema = new mongoose.Schema({
  provider: {
    type: String,
    required: true,
  },
  allPlans: [
    {
      provider: String,
      plans: [dataPlanSchema], // Array of data plans for each provider
    },
  ],
});

// Create a model for provider data plans
const DataPlan = mongoose.model('DataPlan', providerPlansSchema);

module.exports = DataPlan;
