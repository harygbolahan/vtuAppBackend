const mongoose = require('mongoose');

const routesSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    enum: ['datahouse', 'autopilot', 'bwsub', 'ayinlak'], // Add all possible integration names
    description: 'Identifier for the integration'
  },
  service: {
    type: String,
    required: true,
    trim: true,
    enum: ['MTN_SME', 'AIRTEL', 'GLO', 'ETISALAT'], // Extend as needed
    description: 'Service offered by the integration'
  },
  isActive: {
    type: Boolean,
    default: false,
    description: 'Indicates whether the integration is currently active'
  },
  config: {
    type: Map,
    of: String, // Values will be strings (e.g., API keys, endpoints)
    default: {},
    description: 'Custom configuration for the integration, such as API keys and other credentials'
  },
  priority: {
    type: Number,
    default: 0,
    description: 'Priority level for fallback handling; higher priority is preferred'
  },
  fallbackEnabled: {
    type: Boolean,
    default: false,
    description: 'Specifies whether this integration can serve as a fallback'
  },
  lastUsedAt: {
    type: Date,
    default: null,
    description: 'Tracks the last time this integration was used'
  }
}, { 
  timestamps: true,
  versionKey: false // Disables the `__v` field
});

// Add pre-save hooks, if necessary
routesSchema.pre('save', function(next) {
  // Custom logic before saving an integration, e.g., ensure at least one integration is active
  if (this.isModified('isActive') && this.isActive) {
    mongoose.models.Routes.updateMany(
      { isActive: true },
      { isActive: false }
    ).then(() => next()).catch(next);
  } else {
    next();
  }
});

module.exports = mongoose.model('Routes', routesSchema);
