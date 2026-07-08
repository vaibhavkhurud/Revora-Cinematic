import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        maxlength: 100
    },
    message: {
        type: String,
        required: true
    },
    is_read: {
        type: Boolean,
        default: false
    }
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

export default mongoose.model('Notification', notificationSchema);
