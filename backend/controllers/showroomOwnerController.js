import Showroom from '../models/Showroom.js';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import User from '../models/User.js';

const emptyDashboard = (showroom) => ({
    showroom,
    stats: {
        totalBookings: 0,
        upcomingShoots: 0,
        completedShoots: 0,
        pendingPayments: 0
    },
    recentBookings: [],
    bookingStatusChart: [],
    upcomingShoots: []
});

// @desc    Get showroom owner dashboard summary
// @route   GET /api/showroom-owner/dashboard
// @access  Showroom Owner
export const getShowroomOwnerDashboard = async (req, res) => {
    try {
        const showroom = await Showroom.findOne({ owner_id: req.user._id });

        if (!showroom) {
            return res.status(404).json({ message: 'Showroom profile not found' });
        }

        if (showroom.status !== 'approved') {
            return res.json(emptyDashboard(showroom));
        }

        const showroomId = showroom._id;

        // Stats
        const now = new Date();
        const bookings = await Booking.find({ showroom_id: showroomId }).populate('package_id', 'name price');
        
        let upcomingShootsCount = 0;
        let completedShootsCount = 0;
        let pendingPaymentsCount = 0;

        for (const booking of bookings) {
            if (booking.booking_date >= now && ['pending', 'assigned', 'arrived', 'shooting'].includes(booking.status)) {
                upcomingShootsCount++;
            }
            if (booking.status === 'completed') {
                completedShootsCount++;
            }
            
            const payment = await Payment.findOne({ booking_id: booking._id });
            if (!payment || payment.status === 'pending') {
                pendingPaymentsCount++;
            }
        }

        const stats = {
            totalBookings: bookings.length,
            upcomingShoots: upcomingShootsCount,
            completedShoots: completedShootsCount,
            pendingPayments: pendingPaymentsCount
        };

        // Recent Bookings
        const recentBookingsRaw = await Booking.find({ showroom_id: showroomId })
            .populate('package_id', 'name price')
            .sort({ created_at: -1 })
            .limit(6);

        const recentBookings = [];
        for (const booking of recentBookingsRaw) {
            const payment = await Payment.findOne({ booking_id: booking._id }).sort({ created_at: -1 });
            recentBookings.push({
                id: booking._id,
                booking_date: booking.booking_date,
                status: booking.status,
                created_at: booking.created_at,
                package_name: booking.package_id ? booking.package_id.name : null,
                price: booking.package_id ? booking.package_id.price : null,
                payment_status: payment ? payment.status : 'pending'
            });
        }

        // Booking Status Chart
        const statusCounts = bookings.reduce((acc, curr) => {
            acc[curr.status] = (acc[curr.status] || 0) + 1;
            return acc;
        }, {});

        const bookingStatusChart = Object.keys(statusCounts).map(status => ({
            name: status,
            value: statusCounts[status]
        })).sort((a, b) => b.value - a.value);

        // Upcoming Shoots
        const upcomingShootsRaw = await Booking.find({
            showroom_id: showroomId,
            booking_date: { $gte: now },
            status: { $in: ['pending', 'assigned', 'arrived', 'shooting'] }
        })
        .populate('package_id', 'name')
        .populate({
            path: 'videographer_id',
            populate: {
                path: 'user_id',
                select: 'name'
            }
        })
        .sort({ booking_date: 1 })
        .limit(5);

        const upcomingShoots = upcomingShootsRaw.map(booking => ({
            id: booking._id,
            booking_date: booking.booking_date,
            status: booking.status,
            package_name: booking.package_id ? booking.package_id.name : null,
            videographer_name: booking.videographer_id && booking.videographer_id.user_id ? booking.videographer_id.user_id.name : null
        }));

        res.json({
            showroom,
            stats,
            recentBookings,
            bookingStatusChart,
            upcomingShoots
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get showroom owner profile
// @route   GET /api/showroom-owner/profile
// @access  Showroom Owner
export const getShowroomProfile = async (req, res) => {
    try {
        const showroom = await Showroom.findOne({ owner_id: req.user._id }).populate('owner_id', 'name email');
        if (!showroom) {
            return res.status(404).json({ message: 'Showroom profile not found' });
        }
        res.json({ showroom });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update showroom owner profile
// @route   PUT /api/showroom-owner/profile
// @access  Showroom Owner
export const updateShowroomProfile = async (req, res) => {
    try {
        const { owner_name, email, name, contact_number, address, map_link } = req.body;

        const showroom = await Showroom.findOne({ owner_id: req.user._id });
        if (!showroom) {
            return res.status(404).json({ message: 'Showroom profile not found' });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update User info
        if (owner_name !== undefined) user.name = owner_name.trim();
        if (email !== undefined) {
            const emailLower = email.toLowerCase().trim();
            if (emailLower !== user.email) {
                // Check if email already exists
                const existingUser = await User.findOne({ email: emailLower });
                if (existingUser) {
                    return res.status(400).json({ message: 'Email is already in use by another account' });
                }
                user.email = emailLower;
            }
        }
        await user.save();

        // Update Showroom info
        if (name !== undefined) showroom.name = name.trim();
        if (contact_number !== undefined) showroom.contact_number = contact_number.trim();
        if (address !== undefined) showroom.address = address.trim();
        if (map_link !== undefined) showroom.map_link = map_link.trim() || null;
        await showroom.save();

        // Fetch fully updated populated showroom profile
        const updatedShowroom = await Showroom.findById(showroom._id).populate('owner_id', 'name email');

        res.json({
            message: 'Profile updated successfully',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            showroom: updatedShowroom
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update showroom location (address + map link)
// @route   PUT /api/showroom-owner/location
// @access  Showroom Owner
export const updateShowroomLocation = async (req, res) => {
    try {
        const { address, map_link } = req.body;
        const showroom = await Showroom.findOne({ owner_id: req.user._id });
        if (!showroom) {
            return res.status(404).json({ message: 'Showroom profile not found' });
        }

        if (address !== undefined) showroom.address = address.trim();
        if (map_link !== undefined) showroom.map_link = map_link.trim() || null;

        await showroom.save();
        res.json({ message: 'Location updated successfully', showroom });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

