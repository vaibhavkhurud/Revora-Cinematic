import mongoose from 'mongoose';

const videographerSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    phone: {
        type: String,
        maxlength: 20
    },
    address: {
        type: String
    },
    payout_profile: {
        bank_name: { type: String },
        account_name: { type: String },
        account_number: { type: String },
        ifsc_code: { type: String },
        upi_id: { type: String }
    },
    status: {
        type: String,
        enum: ['available', 'assigned', 'on_leave'],
        default: 'available'
    }
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

export default mongoose.model('Videographer', videographerSchema);
