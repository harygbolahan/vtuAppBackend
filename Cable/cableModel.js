const mongoose = require('mongoose');

const cableSchema = new mongoose.Schema({
    userID:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    transactionId:{
        type: String,
        required: true,
        unique: true,
        default: ()=> `TXN-CAB-${Date.now()}`
    },
    cableType: {
        type: String,
        required: [true, 'Please provide a name for the cable'],
        enum: ['GOTV', 'DSTV', 'STARTIMES', 'SHOWMAX']
    },
    amount: {
        type: Number,
        required: [true, 'Please provide an amount for the cable'],
    },
    iucNumber:{
        type: String,
        required: [true, 'Please provide an iuc number for the cable'],
    },
    status: {
        type: String,
        required: [true, 'Please provide a status for the cable'],
        enum: [ 'initialised','pending', 'success', 'failed'],
        default: 'initialised'
    },
    response: {
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

cableSchema.index({userID: 1, status: 1})

cableSchema.statics.findByTransactionId = async function (transactionId) {
    return this.findOne({ transactionId });
}

// Middleware for status-based timestamp updates
cableSchema.pre("save", function (next) {
    if (this.isModified("status")) {
      if (this.status === "success") this.completedAt = new Date();
      else if (this.status === "failed") this.failedAt = new Date();
    }
    next();
  });

module.exports = mongoose.model('Cable', cableSchema);