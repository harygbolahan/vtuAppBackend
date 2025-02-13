// routes/providerMappingRoutes.js
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/adminAuthMiddleware");
const providerMappingController = require("../controllers/providerController");

// Optionally, add your admin authentication middleware here.
// Example: router.use(requireAdminMiddleware);

// Create a new mapping
router.post("/", authMiddleware.protectRoute, authMiddleware.verifyIsAdmin, providerMappingController.createMapping);


// Get all mappings (optionally filter by network, type, isActive via query parameters)
router.get("/", providerMappingController.getMappings);

// Get a single mapping by ID
router.get("/:id", providerMappingController.getMappingById);

// Update a mapping by ID
router.put("/:id", providerMappingController.updateMapping);

// Delete a mapping by ID
router.delete("/:id", providerMappingController.deleteMapping);

module.exports = router;
