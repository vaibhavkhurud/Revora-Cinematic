import mongoose from 'mongoose';

const bookingActivitySchema = new mongoose.Schema({
    booking_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        required: true,
        maxlength: 150
    },
    details: {
        type: String,
        maxlength: 500
    }
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

bookingActivitySchema.index({ booking_id: 1, created_at: -1 });

export default mongoose.model('BookingActivity', bookingActivitySchema);
