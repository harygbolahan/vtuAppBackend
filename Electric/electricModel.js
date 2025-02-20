const mongoose = require('mongoose');

const electricSchema = new mongoose.Schema({
    userID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    transactionId: {
        type: String,
        required: true,
        unique: true,
        default: () => `TXN-ELE-${Date.now()}`
    },
    discoType: {
        type: String,
        required: true,
    },
    details:{
        type: String,
    },
    token:{
        type: String
    },
    units:{
        type: String
    },
    amount: {
        type: Number,
        required: true,
    },
    meterNumber: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        required: true,
        enum: ['initialised', 'pending', 'success', 'failed'],
        default: 'initialised'
    },
    previousBalance: {
        type: Number,
    },
    currentBalance: {
        type: Number,
    },
    externalTransactionId: {
        type: String,
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
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
},
    {
        timestamps: true
    }
)

electricSchema.index({ userID: 1, status: 1 });

electricSchema.pre("save", function (next) {
    if (this.isModified("status")) {
            this.updatedAt = Date.now();
    }
    next()
})

module.exports = mongoose.model('Electric', electricSchema);