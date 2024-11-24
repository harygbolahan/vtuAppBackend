const mongoose = require('mongoose');

const electricDiscoSchema = new mongoose.Schema({
    category_name: {
        type: String,
        required: [true, 'Please enter category name']
    },
    category_type: {
        type: String,
        required: [true, 'Please enter category type']
    },
    products: [
        {
            discoName: {
                type: String,
                required: [true, 'Please enter disco name']
            },
            discoId: {
                type: String,
                required: [true, 'Please enter disco id']
            },
            discoCode: {
                type: String,
                required: [true, 'Please enter disco code']
            },
            minAmount: {
                type: Number,
                required: [true, 'Please enter minimum amount']
            },
            maxAmount: {
                type: Number,
                required: [true, 'Please enter maximum amount']
            },
            convenienceFee: {
                type: Number,
                default: 0 // Default to 0 if not provided
            },
            variations: {
                type: Array,
                default: [] // Default to an empty array if there are no variations
            }
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('ElectricDisco', electricDiscoSchema);
