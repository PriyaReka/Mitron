const mongoose = require('mongoose');

const SchemeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String,
    eligibility: {
        minLandSize: Number,
        maxLandSize: Number,
        cropType: [String],
        state: [String]
    },
    benefits: String,
    applicationProcess: [String], // Steps
    active: { type: Boolean, default: true }
});

module.exports = mongoose.model('Scheme', SchemeSchema);
