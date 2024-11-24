const mongoose = require('mongoose');

const cablePlanSchema = new mongoose.Schema({
    planName: {
        type: String,
        required: [true, 'Please enter plan name']
    },
    planId: {
        type: String,
        required: [true, 'Please enter plan id']
    },
    planDescription: {
        type: String,
        required: [true, 'Please enter plan description']
    },
    planType:{
        type: String,
        required: [true, 'Please enter plan type']
    },
    multiChoicePrice:{
        type: Number,
        required: [true, 'Please enter multi choice price']
    },
    ourPrice:{
        type: Number,
        required: [true, 'Please enter single choice price']
    },
    multiChoiceStatus:{
        type: String,
        required: [true, 'Please enter plan status']
    },
   ourStatus:{
        type: String,
        required: [true, 'Please enter plan status']
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('CablePlan', cablePlanSchema);