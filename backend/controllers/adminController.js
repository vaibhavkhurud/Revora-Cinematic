import bcrypt from 'bcrypt';
import crypto from 'crypto';
import User from '../models/User.js';
import Videographer from '../models/Videographer.js';
import Booking from '../models/Booking.js';
import Package from '../models/Package.js';

// @desc    Add a new videographer
// @route   POST /api/admin/videographers
// @access  Private/SuperAdmin
export const addVideographer = async (req, res) => {
    try {
        const { name, email, phone } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        // Auto-generate password (12 chars)
        const generatedPassword = crypto.randomBytes(6).toString('hex');
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(generatedPassword, salt);

        const user = new User({
            name,
            email,
            password: hashedPassword,
            role: 'videographer'
        });
        await user.save();

        const videographer = new Videographer({
            user_id: user._id,
            phone: phone || ''
        });
        await videographer.save();

        // Mocking an email sent to the videographer with their credentials
        console.log(`[MOCK EMAIL] To: ${email} | Subject: Your Revora Cinematic Account`);
        console.log(`[MOCK EMAIL] Hi ${name}, your account has been created. Login with email: ${email} and password: ${generatedPassword}`);

        res.status(201).json({
            message: 'Videographer added successfully',
            videographer: {
                name: user.name,
                email: user.email,
                phone: videographer.phone,
                generatedPassword
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all videographers
// @route   GET /api/admin/videographers
// @access  Private/SuperAdmin
export const getVideographers = async (req, res) => {
    try {
        const videographers = await Videographer.find()
            .populate('user_id', 'name email created_at')
            .sort({ created_at: -1 });

        res.json({
            videographers: videographers.map(v => ({
                id: v._id,
                name: v.user_id.name,
                email: v.user_id.email,
                phone: v.phone,
                status: v.status,
                joined: v.user_id.created_at
            }))
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Reset videographer password
// @route   PUT /api/admin/videographers/:id/reset-password
// @access  Private/SuperAdmin
export const resetVideographerPassword = async (req, res) => {
    try {
        const videographer = await Videographer.findById(req.params.id).populate('user_id');
        if (!videographer) {
            return res.status(404).json({ message: 'Videographer not found' });
        }

        const user = await User.findById(videographer.user_id._id);
        if (!user) {
            return res.status(404).json({ message: 'User record not found' });
        }

        // Auto-generate a new password (12 chars hex)
        const newPassword = crypto.randomBytes(6).toString('hex');
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedPassword;
        await user.save();

        res.json({
            message: 'Password reset successfully',
            newPassword
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get videographer detailed report
// @route   GET /api/admin/videographers/:id/report
// @access  Private/SuperAdmin
export const getVideographerReport = async (req, res) => {
    try {
        const videographer = await Videographer.findById(req.params.id).populate('user_id', 'name email phone created_at');
        if (!videographer) {
            return res.status(404).json({ message: 'Videographer not found' });
        }

        const bookings = await Booking.find({ videographer_id: videographer._id })
            .populate('package_id', 'name price')
            .populate('showroom_id', 'name address')
            .sort({ booking_date: -1 });

        let totalShoots = bookings.length;
        let completedShoots = 0;
        let totalEarnings = 0;

        const recent_shoots = bookings.map(booking => {
            if (booking.status === 'completed') {
                completedShoots++;
                totalEarnings += (booking.package_id?.price || 0);
            }

            return {
                id: booking._id,
                customer_name: booking.customer_name,
                vehicle: `${booking.vehicle_brand} ${booking.vehicle_model}`,
                registration_number: booking.registration_number,
                booking_date: booking.booking_date,
                status: booking.status,
                package: booking.package_id?.name || 'N/A',
                earnings: booking.status === 'completed' ? (booking.package_id?.price || 0) : 0,
                showroom: booking.showroom_id?.name || 'N/A'
            };
        });

        res.json({
            profile: {
                id: videographer._id,
                name: videographer.user_id?.name || 'Unknown',
                email: videographer.user_id?.email || 'N/A',
                phone: videographer.phone || 'N/A',
                status: videographer.status,
                joined: videographer.user_id?.created_at
            },
            stats: {
                total_shoots: totalShoots,
                completed_shoots: completedShoots,
                completion_rate: totalShoots > 0 ? Math.round((completedShoots / totalShoots) * 100) : 0,
                total_earnings: totalEarnings
            },
            recent_shoots
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
