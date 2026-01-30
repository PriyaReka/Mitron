const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    mobile: { type: String, required: true, unique: true },
    aadhar: { type: String, unique: true },
    fullName: { type: String },
    language: { type: String, default: 'en' },
    role: { type: String, enum: ['farmer', 'expert', 'admin'], default: 'farmer' },
    location: {
        state: String,
        district: String
    },
    onboardingCompleted: { type: Boolean, default: false },
    landDetails: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Land'
    }],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
