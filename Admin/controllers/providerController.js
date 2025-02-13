// controllers/providerMappingController.js
const ProviderMapping = require("../models/providerModel");

/**
 * Create a new provider mapping.
 */
exports.createMapping = async (req, res) => {
  try {
    const { network, type, provider, providerPlanId, providerPrice, isActive } = req.body;
    const mapping = new ProviderMapping({
      network,
      type,
      provider,
      providerPlanId,
      providerPrice,
      isActive,
    });
    await mapping.save();
    return res.status(201).json({ message: "Mapping created successfully", data: mapping });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Mapping for this network and type already exists." });
    }
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Retrieve all provider mappings (with optional query filters).
 */
exports.getMappings = async (req, res) => {
  try {
    const filters = {};
    if (req.query.network) filters.network = req.query.network;
    if (req.query.type) filters.type = req.query.type;
    if (req.query.isActive) filters.isActive = req.query.isActive === "true";

    const mappings = await ProviderMapping.find(filters);
    return res.status(200).json({ data: mappings });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Retrieve a single provider mapping by its ID.
 */
exports.getMappingById = async (req, res) => {
  try {
    const mapping = await ProviderMapping.findById(req.params.id);
    if (!mapping) return res.status(404).json({ message: "Mapping not found" });
    return res.status(200).json({ data: mapping });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Update an existing provider mapping by its ID.
 */
exports.updateMapping = async (req, res) => {
  try {
    const mapping = await ProviderMapping.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!mapping) return res.status(404).json({ message: "Mapping not found" });
    return res.status(200).json({ message: "Mapping updated", data: mapping });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Mapping for this network and type already exists." });
    }
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Delete a provider mapping by its ID.
 */
exports.deleteMapping = async (req, res) => {
  try {
    const mapping = await ProviderMapping.findByIdAndDelete(req.params.id);
    if (!mapping) return res.status(404).json({ message: "Mapping not found" });
    return res.status(200).json({ message: "Mapping deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};
