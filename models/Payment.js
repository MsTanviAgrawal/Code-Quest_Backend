import mongoose from "mongoose";

const paymentSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    orderId: {
        type: String,
        required: true,
        unique: true
    },
    paymentId: {
        type: String
    },
    razorpaySignature: {
        type: String
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'INR'
    },
    planType: {
        type: String,
        enum: ['bronze', 'silver', 'gold'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    },
    paymentMethod: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    completedAt: {
        type: Date
    },
    invoiceNumber: {
        type: String,
        unique: true
    },
    email: {
        type: String
    },
    phone: {
        type: String
    }
});

// Generate invoice number
paymentSchema.pre('save', function(next) {
    if (!this.invoiceNumber && this.status === 'completed') {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        this.invoiceNumber = `INV-${year}${month}-${random}`;
    }
    next();
});

export default mongoose.model("Payment", paymentSchema);
