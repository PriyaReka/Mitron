const mongoose = require('mongoose');

const LandSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    landType: { type: String, enum: ['wetland', 'dryland'], required: true },
    measurementType: { type: String, enum: ['dimensions', 'area'], required: true },
    dimensions: {
        length: Number,
        width: Number
    },
    area: {
        totalArea: Number,
        areaUnit: { type: String, enum: ['acres', 'hectares'] }
    },
    soilProfile: {
        soilType: String,        // Color: blackSoil, redSoil...
        soilPH: String,          // Water Behavior
        organicMatter: String,   // Feel
        drainageCondition: String,
        irrigationAvailable: String,
        soilDepth: String,
        previousCrop: String
    },
    location: {
        state: String,
        district: String
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Land', LandSchema);
