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
    status: {
        type: String,
        enum: ['available', 'assigned', 'on_leave'],
        default: 'available'
    }
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

export default mongoose.model('Videographer', videographerSchema);
