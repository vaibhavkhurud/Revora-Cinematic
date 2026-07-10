import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import Package from '../models/Package.js';
import Showroom from '../models/Showroom.js';
import Videographer from '../models/Videographer.js';
import User from '../models/User.js';

// Helper: generate last N months labels + date ranges
const getMonthRanges = (numMonths = 6) => {
    const months = [];
    const now = new Date();
    for (let i = numMonths - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const start = new Date(d.getFullYear(), d.getMonth(), 1);
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
        months.push({
            label: d.toLocaleString('default', { month: 'short', year: '2-digit' }),
            start,
            end
        });
    }
    return months;
};

// @desc    Get analytics overview
// @route   GET /api/analytics/overview
// @access  Private/SuperAdmin
export const getOverview = async (req, res) => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

        // Total counts
        const [
            totalBookings,
            totalShowrooms,
            totalVideographers,
            totalUsers,
            monthBookings,
            lastMonthBookings,
            completedBookings,
            pendingBookings
        ] = await Promise.all([
            Booking.countDocuments(),
            Showroom.countDocuments({ status: 'approved' }),
            Videographer.countDocuments(),
            User.countDocuments(),
            Booking.countDocuments({ created_at: { $gte: startOfMonth } }),
            Booking.countDocuments({ created_at: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
            Booking.countDocuments({ status: 'completed' }),
            Booking.countDocuments({ status: { $in: ['pending', 'assigned'] } })
        ]);

        // Revenue from completed bookings (via joined Package price)
        const revenueAgg = await Booking.aggregate([
            { $match: { status: 'completed' } },
            {
                $lookup: {
                    from: 'packages',
                    localField: 'package_id',
                    foreignField: '_id',
                    as: 'package'
                }
            },
            { $unwind: '$package' },
            { $group: { _id: null, total: { $sum: '$package.price' } } }
        ]);
        const totalRevenue = revenueAgg[0]?.total || 0;

        const monthRevenueAgg = await Booking.aggregate([
            { $match: { status: 'completed', updated_at: { $gte: startOfMonth } } },
            {
                $lookup: {
                    from: 'packages',
                    localField: 'package_id',
                    foreignField: '_id',
                    as: 'package'
                }
            },
            { $unwind: '$package' },
            { $group: { _id: null, total: { $sum: '$package.price' } } }
        ]);
        const monthRevenue = monthRevenueAgg[0]?.total || 0;

        res.json({
            totalBookings,
            totalShowrooms,
            totalVideographers,
            totalUsers,
            monthBookings,
            lastMonthBookings,
            completedBookings,
            pendingBookings,
            totalRevenue,
            monthRevenue
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get monthly bookings + revenue chart data
// @route   GET /api/analytics/monthly
// @access  Private/SuperAdmin
export const getMonthlyData = async (req, res) => {
    try {
        const months = getMonthRanges(6);
        const labels = months.map(m => m.label);

        const bookingCounts = await Promise.all(
            months.map(m => Booking.countDocuments({ created_at: { $gte: m.start, $lte: m.end } }))
        );

        const revenueCounts = await Promise.all(
            months.map(async m => {
                const agg = await Booking.aggregate([
                    { $match: { status: 'completed', updated_at: { $gte: m.start, $lte: m.end } } },
                    {
                        $lookup: {
                            from: 'packages',
                            localField: 'package_id',
                            foreignField: '_id',
                            as: 'package'
                        }
                    },
                    { $unwind: '$package' },
                    { $group: { _id: null, total: { $sum: '$package.price' } } }
                ]);
                return agg[0]?.total || 0;
            })
        );

        const completedCounts = await Promise.all(
            months.map(m => Booking.countDocuments({ status: 'completed', updated_at: { $gte: m.start, $lte: m.end } }))
        );

        res.json({ labels, bookings: bookingCounts, revenue: revenueCounts, completed: completedCounts });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get package sales breakdown
// @route   GET /api/analytics/packages
// @access  Private/SuperAdmin
export const getPackageStats = async (req, res) => {
    try {
        const packageSales = await Booking.aggregate([
            {
                $group: {
                    _id: '$package_id',
                    count: { $sum: 1 },
                    completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 8 }
        ]);

        const populated = await Package.populate(packageSales, { path: '_id', select: 'name price' });

        res.json(
            populated.map(p => ({
                name: p._id?.name || 'Unknown',
                price: p._id?.price || 0,
                bookings: p.count,
                completed: p.completed
            }))
        );
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get videographer performance stats
// @route   GET /api/analytics/videographers
// @access  Private/SuperAdmin
export const getVideographerPerformance = async (req, res) => {
    try {
        const performance = await Booking.aggregate([
            { $match: { videographer_id: { $ne: null } } },
            {
                $group: {
                    _id: '$videographer_id',
                    total: { $sum: 1 },
                    completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
                    inProgress: {
                        $sum: { $cond: [{ $in: ['$status', ['arrived', 'shooting', 'editing']] }, 1, 0] }
                    }
                }
            },
            { $sort: { completed: -1 } },
            { $limit: 8 }
        ]);

        const videographers = await Videographer.populate(performance, {
            path: '_id',
            populate: { path: 'user_id', select: 'name' }
        });

        res.json(
            videographers.map(v => ({
                name: v._id?.user_id?.name || 'Unknown',
                total: v.total,
                completed: v.completed,
                inProgress: v.inProgress,
                completionRate: v.total > 0 ? Math.round((v.completed / v.total) * 100) : 0
            }))
        );
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get booking status breakdown
// @route   GET /api/analytics/status
// @access  Private/SuperAdmin
export const getStatusBreakdown = async (req, res) => {
    try {
        const statuses = ['pending', 'assigned', 'arrived', 'shooting', 'editing', 'completed', 'cancelled'];
        const counts = await Promise.all(
            statuses.map(s => Booking.countDocuments({ status: s }))
        );
        res.json({ labels: statuses, data: counts });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
