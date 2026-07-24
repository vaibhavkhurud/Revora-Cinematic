import mongoose from 'mongoose';

const systemSettingSchema = new mongoose.Schema({
    platform_name: {
        type: String,
        default: 'Revora Cinematic',
        trim: true
    },
    support_email: {
        type: String,
        default: 'support@rovora.com',
        trim: true
    },
    commission_rate: {
        type: Number,
        default: 15,
        min: 0,
        max: 100
    },
    maintenance_mode: {
        type: Boolean,
        default: false
    },
    booking_advance_hours: {
        type: Number,
        default: 24,
        min: 1
    }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

export default mongoose.model('SystemSetting', systemSettingSchema);
