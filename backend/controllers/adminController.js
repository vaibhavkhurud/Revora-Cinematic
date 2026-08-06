import bcrypt from 'bcrypt';
import crypto from 'crypto';
import User from '../models/User.js';
import Videographer from '../models/Videographer.js';
import Booking from '../models/Booking.js';
import Package from '../models/Package.js';
import SystemSetting from '../models/SystemSetting.js';
import Withdrawal from '../models/Withdrawal.js';
import Notification from '../models/Notification.js';

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

// @desc    Get admin profile
// @route   GET /api/admin/profile
// @access  Private/SuperAdmin
export const getAdminProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'Admin not found' });
        }
        res.json({ user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update admin profile
// @route   PUT /api/admin/profile
// @access  Private/SuperAdmin
export const updateAdminProfile = async (req, res) => {
    try {
        const { name, email } = req.body;
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        if (name !== undefined) user.name = name.trim();
        if (email !== undefined) {
            const emailLower = email.toLowerCase().trim();
            if (emailLower !== user.email) {
                const existingUser = await User.findOne({ email: emailLower });
                if (existingUser) {
                    return res.status(400).json({ message: 'Email is already in use' });
                }
                user.email = emailLower;
            }
        }

        await user.save();

        res.json({
            message: 'Profile updated successfully',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Change admin password
// @route   PUT /api/admin/change-password
// @access  Private/SuperAdmin
export const changeAdminPassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Please provide current and new passwords' });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Incorrect current password' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.tokenVersion = (user.tokenVersion || 0) + 1;
        await user.save();

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get system settings
// @route   GET /api/admin/system-settings
// @access  Private/SuperAdmin
export const getSystemSettings = async (req, res) => {
    try {
        let settings = await SystemSetting.findOne();
        if (!settings) {
            settings = new SystemSetting();
            await settings.save();
        }
        res.json({ settings });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update system settings
// @route   PUT /api/admin/system-settings
// @access  Private/SuperAdmin
export const updateSystemSettings = async (req, res) => {
    try {
        const { platform_name, support_email, commission_rate, maintenance_mode, booking_advance_hours } = req.body;
        
        let settings = await SystemSetting.findOne();
        if (!settings) {
            settings = new SystemSetting();
        }

        if (platform_name !== undefined) settings.platform_name = platform_name.trim();
        if (support_email !== undefined) settings.support_email = support_email.trim();
        if (commission_rate !== undefined) settings.commission_rate = Number(commission_rate);
        if (maintenance_mode !== undefined) settings.maintenance_mode = !!maintenance_mode;
        if (booking_advance_hours !== undefined) settings.booking_advance_hours = Number(booking_advance_hours);

        await settings.save();

        res.json({
            message: 'System settings updated successfully',
            settings
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all videographer withdrawals
// @route   GET /api/admin/withdrawals
// @access  Private/SuperAdmin
export const getAllWithdrawals = async (req, res) => {
    try {
        const { status } = req.query;
        let query = {};
        if (status && status !== 'all') {
            query.status = status;
        }

        const withdrawals = await Withdrawal.find(query)
            .populate({
                path: 'videographer_id',
                select: 'user_id phone payout_profile',
                populate: { path: 'user_id', select: 'name email' }
            })
            .sort({ requested_at: -1 });

        res.json({ withdrawals });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update withdrawal status
// @route   PATCH /api/admin/withdrawals/:id/status
// @access  Private/SuperAdmin
export const updateWithdrawalStatus = async (req, res) => {
    try {
        const { status, admin_note, transaction_id } = req.body;
        
        if (!['approved', 'rejected', 'completed'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const withdrawal = await Withdrawal.findById(req.params.id)
            .populate({
                path: 'videographer_id',
                select: 'user_id',
                populate: { path: 'user_id', select: 'name' }
            });
            
        if (!withdrawal) {
            return res.status(404).json({ message: 'Withdrawal request not found' });
        }

        const oldStatus = withdrawal.status;
        
        withdrawal.status = status;
        if (admin_note !== undefined) withdrawal.admin_note = admin_note;
        if (transaction_id !== undefined) withdrawal.transaction_id = transaction_id;
        
        if (status === 'completed' || status === 'approved' || status === 'rejected') {
            withdrawal.processed_at = new Date();
            withdrawal.processed_by = req.user._id;
        }

        await withdrawal.save();

        // Notify Videographer
        if (oldStatus !== status) {
            let title = '';
            let message = '';
            
            if (status === 'approved') {
                title = 'Withdrawal Approved';
                message = `Your withdrawal request for ₹${withdrawal.amount} has been approved and is being processed.`;
            } else if (status === 'completed') {
                title = 'Withdrawal Completed';
                message = `Your withdrawal of ₹${withdrawal.amount} has been successfully transferred.`;
            } else if (status === 'rejected') {
                title = 'Withdrawal Rejected';
                message = `Your withdrawal request for ₹${withdrawal.amount} was rejected. ${admin_note ? 'Reason: ' + admin_note : ''}`;
            }

            if (title && withdrawal.videographer_id?.user_id?._id) {
                await new Notification({
                    user_id: withdrawal.videographer_id.user_id._id,
                    title,
                    message
                }).save();
            }
        }

        res.json({ message: 'Withdrawal status updated successfully', withdrawal });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
