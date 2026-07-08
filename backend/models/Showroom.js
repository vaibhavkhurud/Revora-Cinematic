import mongoose from 'mongoose';

const showroomSchema = new mongoose.Schema({
    owner_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true,
        maxlength: 150
    },
    address: {
        type: String
    },
    contact_number: {
        type: String,
        maxlength: 20
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    rejection_reason: {
        type: String,
        default: null
    }
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

export default mongoose.model('Showroom', showroomSchema);
