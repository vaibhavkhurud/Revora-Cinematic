import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
    showroom_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Showroom',
        required: true
    },
    package_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Package',
        required: true
    },
    videographer_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Videographer',
        default: null
    },
    customer_name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 120
    },
    customer_mobile: {
        type: String,
        required: true,
        trim: true,
        maxlength: 20
    },
    vehicle_brand: {
        type: String,
        required: true,
        trim: true,
        maxlength: 80
    },
    vehicle_model: {
        type: String,
        required: true,
        trim: true,
        maxlength: 80
    },
    vehicle_type: {
        type: String,
        required: true,
        trim: true,
        maxlength: 60
    },
    vehicle_color: {
        type: String,
        required: true,
        trim: true,
        maxlength: 60
    },
    registration_number: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
        maxlength: 30
    },
    booking_date: {
        type: Date,
        required: true
    },
    time_slot: {
        type: String,
        required: true,
        maxlength: 30
    },
    status: {
        type: String,
        enum: ['pending', 'assigned', 'arrived', 'shooting', 'editing', 'completed', 'cancelled'],
        default: 'pending'
    },
    notes: {
        type: String,
        trim: true,
        maxlength: 1000
    },
    videographer_response: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    },
    videographer_response_note: {
        type: String,
        trim: true,
        maxlength: 500,
        default: null
    }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

bookingSchema.index({ showroom_id: 1, created_at: -1 });
bookingSchema.index({ showroom_id: 1, status: 1 });
bookingSchema.index({ showroom_id: 1, booking_date: 1 });
bookingSchema.index({ registration_number: 1 });

export default mongoose.model('Booking', bookingSchema);
