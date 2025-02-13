// models/ProviderMapping.js
const mongoose = require("mongoose");

const providerMappingSchema = new mongoose.Schema(
  {
    network: {
      type: String,
      required: true,
      enum: ["MTN", "GLO", "AIRTEL", "9MOBILE"],
    },
    type: {
      type: String,
      required: true,
      // These values should match your data purchase types:
      enum: ["SME", "Corporate Gifting", "Awoof Gifting", "SME2", "GIFTING", "CORPORATE"],
    },
    provider: {
      type: String,
      required: true,
      // Providers that you support:
      enum: ["autoPilot", "datahouse", "ogdams"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Ensure that the combination of network and type is unique.
providerMappingSchema.index({ network: 1, type: 1 }, { unique: true });

/**
 * Static method to get the allocated provider mapping for a given network and type.
 * @param {String} network - The network (e.g., "MTN")
 * @param {String} type - The network type (e.g., "SME")
 * @returns {Promise<Object|null>} - The mapping document if found, otherwise null.
 */
providerMappingSchema.statics.getAllocatedProvider = async function(network, type) {
  return await this.findOne({ network, type, isActive: true });
};

module.exports = mongoose.model("ProviderMapping", providerMappingSchema);
