import mongoose from 'mongoose';

const withdrawalSchema = new mongoose.Schema({
    videographer_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Videographer',
        required: true,
        index: true
    },
    amount: {
        type: Number,
        required: true,
        min: 100
    },
    payment_method: {
        type: String,
        enum: ['upi', 'bank_transfer'],
        required: true
    },
    payout_details: {
        upi_id: { type: String, default: '' },
        account_number: { type: String, default: '' },
        ifsc_code: { type: String, default: '' },
        bank_name: { type: String, default: '' },
        account_holder_name: { type: String, default: '' }
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'completed'],
        default: 'pending',
        index: true
    },
    transaction_id: {
        type: String,
        default: null
    },
    admin_note: {
        type: String,
        default: null
    },
    processed_at: {
        type: Date,
        default: null
    },
    processed_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, { timestamps: { createdAt: 'requested_at', updatedAt: 'updated_at' } });

export default mongoose.model('Withdrawal', withdrawalSchema);
