import mongoose from 'mongoose';

const bookingImageSchema = new mongoose.Schema({
    booking_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true
    },
    image_url: {
        type: String,
        required: true,
        maxlength: 255
    },
    uploaded_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: { createdAt: 'uploaded_at', updatedAt: false } });

export default mongoose.model('BookingImage', bookingImageSchema);
