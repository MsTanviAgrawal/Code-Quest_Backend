import mongoose from "mongoose";

const loginHistorySchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    email: {
        type: String
    },
    phone: {
        type: String
    },
    browser: {
        type: String,
        required: true
    },
    os: {
        type: String,
        required: true
    },
    deviceType: {
        type: String,
        enum: ['mobile', 'tablet', 'desktop', 'laptop'],
        required: true
    },
    ipAddress: {
        type: String,
        required: true
    },
    loginMethod: {
        type: String,
        enum: ['email', 'phone', 'google'],
        required: true
    },
    requireOtp: {
        type: Boolean,
        default: false
    },
    loginTime: {
        type: Date,
        default: Date.now
    },
    location: {
        country: String,
        city: String
    },
    success: {
        type: Boolean,
        default: true
    }
});

export default mongoose.model("LoginHistory", loginHistorySchema);
