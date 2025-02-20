const mongoose = require('mongoose');

const airtimeSchema = new mongoose.Schema({
    userID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    transactionId: {
        type: String,
        required: true,
        unique: true,
        default: () => `TXN-AIR-${Date.now()}}`
    },
    network: {
        type: String,
        required: true,
        enum: ['MTN', 'GLO', 'AIRTEL', '9MOBILE']
    },
    amount: {
        type: Number,
        required: true,
        min: [100, 'Minimum amount is NGN 100']
    },
    phoneNumber: {
        type: String,
        required: true,
        validate: {
            validator: function (v) {
                /^(0)\d{10}$/;
            },
            message: 'Invalid phone number'
        }
    },
    status: {
        type: String,
        enum:["initialised", "pending", "success", "failed"],
        default: "initialised"
    },
    response:{
        type: String,
        default: null
    },
    externalTransactionId: {
        type: String,
        default: null
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
    timestamps: true
}
    
);

airtimeSchema.index({ userID: 1, status: 1 });

airtimeSchema.statics.findByTransactionId = async function (transactionId) {
    return await this.findOne({ transactionId });
  };
  
  // Middleware for status-based timestamp updates
  airtimeSchema.pre("save", function (next) {
    if (this.isModified("status")) {
      if (this.status === "success") this.completedAt = new Date();
      else if (this.status === "failed") this.failedAt = new Date();
    }
    next();
  });

module.exports = mongoose.model('Airtime', airtimeSchema)