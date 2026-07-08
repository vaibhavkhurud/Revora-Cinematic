import mongoose from 'mongoose';

const packageSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        maxlength: 100
    },
    description: {
        type: String
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
    features: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    is_active: {
        type: Boolean,
        default: true
    }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

export default mongoose.model('Package', packageSchema);
