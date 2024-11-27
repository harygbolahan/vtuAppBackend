const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  reference: { type: String, required: true, unique: true },
  amount: { type: Number, required: true },
  fee: { type: Number,  },
  settlementAmount: { type: Number,  },
  description: { type: String },
  currency: { type: String,  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderAccountNumber: { type: String },
  senderBankName: { type: String },
  senderName: { type: String },
  status: { type: String, enum: ['completed', 'pending', 'failed'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
});

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = { Payment };
