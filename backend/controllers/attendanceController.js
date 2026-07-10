import Attendance from '../models/Attendance.js';
import Videographer from '../models/Videographer.js';

// Helper to get start of today in UTC to avoid timezone issues with querying
const getStartOfToday = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

// @desc    Check In Videographer
// @route   POST /api/attendance/check-in
// @access  Private/Videographer
export const checkIn = async (req, res) => {
    try {
        const videographer = await Videographer.findOne({ user_id: req.user._id });
        if (!videographer) {
            return res.status(404).json({ message: 'Videographer profile not found' });
        }

        const today = getStartOfToday();
        
        // Check if already checked in today
        const existingRecord = await Attendance.findOne({ 
            videographer_id: videographer._id, 
            date: today 
        });

        if (existingRecord) {
            return res.status(400).json({ message: 'Already checked in today' });
        }

        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { hour12: false }); // e.g., '14:30:00'

        // Determine if late (e.g., after 10:00 AM)
        const hour = now.getHours();
        const status = hour >= 10 ? 'late' : 'present';

        const attendance = new Attendance({
            videographer_id: videographer._id,
            date: today,
            check_in_time: timeString,
            status
        });

        await attendance.save();
        res.status(201).json({ message: 'Checked in successfully', attendance });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Check Out Videographer
// @route   PUT /api/attendance/check-out
// @access  Private/Videographer
export const checkOut = async (req, res) => {
    try {
        const videographer = await Videographer.findOne({ user_id: req.user._id });
        if (!videographer) {
            return res.status(404).json({ message: 'Videographer profile not found' });
        }

        const today = getStartOfToday();
        
        const attendance = await Attendance.findOne({ 
            videographer_id: videographer._id, 
            date: today 
        });

        if (!attendance) {
            return res.status(400).json({ message: 'No check-in record found for today' });
        }

        if (attendance.check_out_time) {
            return res.status(400).json({ message: 'Already checked out today' });
        }

        const now = new Date();
        attendance.check_out_time = now.toLocaleTimeString('en-US', { hour12: false });
        
        await attendance.save();
        res.json({ message: 'Checked out successfully', attendance });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get Attendance History
// @route   GET /api/attendance
// @access  Private/Videographer
export const getAttendanceHistory = async (req, res) => {
    try {
        const videographer = await Videographer.findOne({ user_id: req.user._id });
        if (!videographer) {
            return res.status(404).json({ message: 'Videographer profile not found' });
        }

        const { month, year } = req.query;
        let query = { videographer_id: videographer._id };

        // If month and year are provided, filter by that month
        if (month && year) {
            const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
            const endDate = new Date(parseInt(year), parseInt(month), 0); // Last day of month
            query.date = { $gte: startDate, $lte: endDate };
        }

        const history = await Attendance.find(query).sort({ date: -1 });

        // Calculate statistics
        let present = 0;
        let late = 0;
        let halfDay = 0;
        let absent = 0; // Usually calculated by subtracting total working days from recorded days
        let totalHours = 0;

        history.forEach(record => {
            if (record.status === 'present') present++;
            if (record.status === 'late') late++;
            if (record.status === 'half_day') halfDay++;
            if (record.status === 'absent') absent++;

            if (record.check_in_time && record.check_out_time) {
                // Calculate hours difference
                const [inH, inM] = record.check_in_time.split(':').map(Number);
                const [outH, outM] = record.check_out_time.split(':').map(Number);
                
                const inDate = new Date().setHours(inH, inM, 0, 0);
                const outDate = new Date().setHours(outH, outM, 0, 0);
                
                const diffHours = (outDate - inDate) / (1000 * 60 * 60);
                if (diffHours > 0) {
                    totalHours += diffHours;
                }
            }
        });

        // Get today's record to check UI state
        const today = getStartOfToday();
        const todayRecord = await Attendance.findOne({ videographer_id: videographer._id, date: today });

        res.json({
            todayRecord,
            stats: {
                present,
                late,
                halfDay,
                absent,
                totalHours: totalHours.toFixed(1)
            },
            history
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
