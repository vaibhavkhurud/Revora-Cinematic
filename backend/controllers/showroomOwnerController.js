import db from '../config/db.js';

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
        const [showroomRows] = await db.execute(
            `SELECT id, name, address, contact_number, status, rejection_reason
             FROM showrooms
             WHERE owner_id = ?
             LIMIT 1`,
            [req.user.id]
        );

        if (showroomRows.length === 0) {
            return res.status(404).json({ message: 'Showroom profile not found' });
        }

        const showroom = showroomRows[0];

        if (showroom.status !== 'approved') {
            return res.json(emptyDashboard(showroom));
        }

        const [statsRows] = await db.execute(
            `SELECT
                COUNT(*) AS totalBookings,
                SUM(CASE WHEN booking_date >= NOW() AND status IN ('pending', 'confirmed') THEN 1 ELSE 0 END) AS upcomingShoots,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completedShoots,
                SUM(CASE WHEN payment_status = 'pending' THEN 1 ELSE 0 END) AS pendingPayments
             FROM (
                SELECT b.id, b.booking_date, b.status,
                       CASE
                            WHEN COUNT(p.id) = 0 THEN 'pending'
                            WHEN SUM(CASE WHEN p.status = 'pending' THEN 1 ELSE 0 END) > 0 THEN 'pending'
                            ELSE 'settled'
                       END AS payment_status
                FROM bookings b
                LEFT JOIN payments p ON p.booking_id = b.id
                WHERE b.showroom_id = ?
                GROUP BY b.id, b.booking_date, b.status
             ) booking_summary`,
            [showroom.id]
        );

        const [recentBookings] = await db.execute(
            `SELECT b.id, b.booking_date, b.status, b.created_at,
                    p.name AS package_name, p.price,
                    COALESCE(MAX(pay.status), 'pending') AS payment_status
             FROM bookings b
             JOIN packages p ON p.id = b.package_id
             LEFT JOIN payments pay ON pay.booking_id = b.id
             WHERE b.showroom_id = ?
             GROUP BY b.id, b.booking_date, b.status, b.created_at, p.name, p.price
             ORDER BY b.created_at DESC
             LIMIT 6`,
            [showroom.id]
        );

        const [bookingStatusChart] = await db.execute(
            `SELECT status AS name, COUNT(*) AS value
             FROM bookings
             WHERE showroom_id = ?
             GROUP BY status
             ORDER BY value DESC`,
            [showroom.id]
        );

        const [upcomingShoots] = await db.execute(
            `SELECT b.id, b.booking_date, b.status,
                    p.name AS package_name,
                    u.name AS videographer_name
             FROM bookings b
             JOIN packages p ON p.id = b.package_id
             LEFT JOIN videographers v ON v.id = b.videographer_id
             LEFT JOIN users u ON u.id = v.user_id
             WHERE b.showroom_id = ?
               AND b.booking_date >= NOW()
               AND b.status IN ('pending', 'confirmed')
             ORDER BY b.booking_date ASC
             LIMIT 5`,
            [showroom.id]
        );

        const stats = statsRows[0] || {};

        res.json({
            showroom,
            stats: {
                totalBookings: Number(stats.totalBookings || 0),
                upcomingShoots: Number(stats.upcomingShoots || 0),
                completedShoots: Number(stats.completedShoots || 0),
                pendingPayments: Number(stats.pendingPayments || 0)
            },
            recentBookings,
            bookingStatusChart: bookingStatusChart.map(item => ({
                name: item.name,
                value: Number(item.value)
            })),
            upcomingShoots
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
