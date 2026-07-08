import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
    booking_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    payment_method: {
        type: String,
        enum: ['cash', 'card', 'bank_transfer', 'online'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    transaction_id: {
        type: String,
        unique: true,
        sparse: true // Allows nulls to not clash on unique constraint
    },
    paid_at: {
        type: Date,
        default: null
    }
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

export default mongoose.model('Payment', paymentSchema);
