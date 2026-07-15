import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        maxlength: 100
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['super_admin', 'showroom_owner', 'videographer'],
        required: true
    },
    reset_token: {
        type: String,
        default: null
    },
    reset_token_expires: {
        type: Date,
        default: null
    },
    tokenVersion: {
        type: Number,
        default: 0
    }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

export default mongoose.model('User', userSchema);
