import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
    videographer_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Videographer',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    check_in_time: {
        type: String, // Or you could use Date, but keeping as String for time like '09:00:00'
        required: true
    },
    check_out_time: {
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: ['present', 'absent', 'late', 'half_day'],
        default: 'present'
    }
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

// Ensure one attendance record per videographer per day
attendanceSchema.index({ videographer_id: 1, date: 1 }, { unique: true });

export default mongoose.model('Attendance', attendanceSchema);
