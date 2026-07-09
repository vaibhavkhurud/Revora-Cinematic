import mongoose from 'mongoose';

const packageSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: null
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    duration_minutes: {
        type: Number,
        required: true,
        min: 1
    },
    features: [{
        type: String,
        trim: true,
        maxlength: 160
    }],
    is_active: {
        type: Boolean,
        default: true,
        index: true
    }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

packageSchema.index({ name: 1 }, { unique: true });
packageSchema.index({ name: 'text', description: 'text' });

export default mongoose.model('Package', packageSchema);
