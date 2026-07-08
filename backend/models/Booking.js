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
        maxlength: 120
    },
    customer_mobile: {
        type: String,
        required: true,
        maxlength: 20
    },
    vehicle_brand: {
        type: String,
        required: true,
        maxlength: 80
    },
    vehicle_model: {
        type: String,
        required: true,
        maxlength: 80
    },
    vehicle_type: {
        type: String,
        required: true,
        maxlength: 60
    },
    vehicle_color: {
        type: String,
        required: true,
        maxlength: 60
    },
    registration_number: {
        type: String,
        required: true,
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
        enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'],
        default: 'pending'
    },
    notes: {
        type: String
    }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

export default mongoose.model('Booking', bookingSchema);
