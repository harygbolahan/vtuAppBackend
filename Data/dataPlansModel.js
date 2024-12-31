const mongoose = require('mongoose');

// Define the schema for a single data plan
const dataPlanSchema = new mongoose.Schema({
  autoPilot: {
    networkId: { type: String, required: false },
    planId: { type: String, required: false },
    providerPrice: { type: Number, required: false },
  },
  ogdams: {
    networkId: { type: String, required: false },
    planId: { type: String, required: false },
    providerPrice: { type: Number, required: false },
  },
  autoSync: {
    networkId: { type: String, required: false },
    planId: { type: String, required: false },
    providerPrice: { type: Number, required: false },
  },
  datahouse: {
    networkId: { type: String, required: false },
    planId: { type: String, required: false },
    providerPrice: { type: Number, required: false },
  },
  bwsub: {
    networkId: { type: String, required: false },
    planId: { type: String, required: false },
    providerPrice: { type: Number, required: false },
  },
  husmoData: {
    networkId: { type: String, required: false },
    planId: { type: String, required: false },
    providerPrice: { type: Number, required: false },
  },
  ayinlak: {
    networkId: { type: String, required: false },
    planId: { type: String, required: false },
    providerPrice: { type: Number, required: false },
  },
  gladtidings: {
    networkId: { type: String, required: false },
    planId: { type: String, required: false },
    providerPrice: { type: Number, required: false },
  },
  network: {
    type: String,
    required: true,
  },
  planName: {
    type: String,
    required: true,
  },
  userPrice: {
    type: Number,
  },
  resellerPrice: {
    type: Number,
  },
  agentPrice: {
    type: Number,
  },
  apiPrice: {
    type: Number,
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
  },
});

const providerPlansSchema = new mongoose.Schema({
  provider: {
      type: String,
      required: true,
  },
  allPlans: [dataPlanSchema], 
});

const DataPlan = mongoose.model('DataPlan', providerPlansSchema);

module.exports = DataPlan;