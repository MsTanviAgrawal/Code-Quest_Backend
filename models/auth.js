import mongoose from "mongoose";

const userschema = mongoose.Schema({
    name: { type: String, required: true },
    email: { 
        type: String, 
        required: false, 
        sparse: true, 
        unique: true,
        default: undefined // This ensures null values are not stored
    },
    password: { type: String, required: false },
    googleId: { type: String, sparse: true },
    phone: { 
        type: String, 
        sparse: true, 
        unique: true 
    },
    about: { type: String },
    tags: { type: [String] },
    friends: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        default: [] 
    }],
    joinedon: { type: Date, default: Date.now }
});

// Create indexes manually to ensure proper sparse behavior
userschema.index({ email: 1 }, { sparse: true, unique: true });
userschema.index({ phone: 1 }, { sparse: true, unique: true });
userschema.index({ googleId: 1 }, { sparse: true });

export default mongoose.model("User", userschema);