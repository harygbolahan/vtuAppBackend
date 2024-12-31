const mongoose = require('mongoose');

const servicesManagementSchema = new mongoose.Schema(
  {
    generalStatus: {
      type: String,
      enum: ['enabled', 'disabled'],
      default: 'enabled',
      required: true,
    },
    networks: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
          lowercase: true,
        },
        status: {
          type: String,
          enum: ['enabled', 'disabled'],
          default: 'enabled',
          required: true,
        },
        types: [
          {
            typeName: {
              type: String,
              required: true,
              trim: true,
              lowercase: true,
            },
            status: {
              type: String,
              enum: ['enabled', 'disabled'],
              default: 'enabled',
              required: true,
            },
            maintenanceMode: {
              isActive: {
                type: Boolean,
                default: false,
              },
              message: String,
              scheduledEndTime: Date,
            },
          },
        ],
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Validation for unique typeNames
servicesManagementSchema.path('networks').validate(function (networks) {
  const errors = [];
  
  networks.forEach((network) => {
    const typeNames = network.types.map((type) => type.typeName);
    const duplicates = typeNames.filter(
      (name, index) => typeNames.indexOf(name) !== index
    );
    
    if (duplicates.length > 0) {
      errors.push(
        `Duplicate typeNames found in network "${network.name}": ${duplicates.join(', ')}`
      );
    }
  });
  
  if (errors.length > 0) {
    throw new Error(errors.join('\n'));
  }
  
  return true;
});

// Simple availability check that returns boolean
servicesManagementSchema.statics.isAvailable = async function (networkName, typeName) {
  try {
    const data = await this.findOne().lean();

    if (!data || data.generalStatus === 'disabled') {
      return false;
    }

    // If only checking general status
    if (!networkName) {
      return true;
    }

    // Find network
    const network = data.networks.find(
      (n) => n.name === networkName.trim()
    );

    if (!network || network.status === 'disabled') {
      return false;
    }

    // If only checking network status
    if (!typeName) {
      return true;
    }

    // Find specific service type
    const type = network.types.find(
      (t) => t.typeName === typeName.trim()
    );

    if (!type || type.status === 'disabled') {
      return false;
    }

    // // Check maintenance mode
    // if (type.maintenanceMode.isActive) {
    //   const now = new Date();
    //   if (!type.maintenanceMode.scheduledEndTime || type.maintenanceMode.scheduledEndTime > now) {
    //     return false;
    //   }
    // }

    return true;
  } catch (error) {
    console.error('Error checking service availability:', error);
    return false;
  }
};

// Additional method for detailed status (if needed internally)
servicesManagementSchema.statics.getDetailedStatus = async function (networkName, typeName) {
  // ... previous detailed implementation here if needed internally ...
};

// Indexes for better query performance
servicesManagementSchema.index({ 'networks.name': 1 });
servicesManagementSchema.index({ 'networks.types.typeName': 1 });
servicesManagementSchema.index({ generalStatus: 1 });

const ServicesManagement = mongoose.model('ServicesManagement', servicesManagementSchema);

module.exports = ServicesManagement;