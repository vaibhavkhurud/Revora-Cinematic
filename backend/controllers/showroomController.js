import Showroom from '../models/Showroom.js';
import Notification from '../models/Notification.js';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';

// @desc    Get all showrooms with owner info + filters + payment status
// @route   GET /api/showrooms
// @access  Super Admin
export const getAllShowrooms = async (req, res) => {
    try {
        const { status, payment_status, search, page = 1, limit = 10 } = req.query;

        let query = {};

        if (status && status !== 'all') {
            query.status = status;
        }

        // We populate owner_id to get owner_name and owner_email
        let showroomsQuery = Showroom.find(query)
            .populate({
                path: 'owner_id',
                select: 'name email'
            })
            .sort({ created_at: -1 });

        const showroomsData = await showroomsQuery.exec();

        // Fetch bookings and payments for all returned showrooms
        const showroomIds = showroomsData.map(s => s._id);
        const allBookings = await Booking.find({ showroom_id: { $in: showroomIds } }).populate('package_id');
        const allBookingIds = allBookings.map(b => b._id);
        const allPayments = await Payment.find({ booking_id: { $in: allBookingIds } });

        const paymentsByBookingId = allPayments.reduce((acc, p) => {
            acc[p.booking_id.toString()] = p;
            return acc;
        }, {});

        const showroomPaymentMap = {};
        for (const s of showroomsData) {
            const sId = s._id.toString();
            const sBookings = allBookings.filter(b => b.showroom_id && b.showroom_id.toString() === sId);
            let paidCount = 0;
            let pendingCount = 0;
            let totalPaid = 0;
            let totalPending = 0;
            const bookingDetails = [];

            for (const b of sBookings) {
                const pay = paymentsByBookingId[b._id.toString()];
                const isPaid = pay && pay.status === 'completed';
                const pkgPrice = b.package_id?.price || pay?.amount || 0;

                if (isPaid) {
                    paidCount++;
                    totalPaid += (pay.amount || pkgPrice);
                } else {
                    pendingCount++;
                    totalPending += pkgPrice;
                }

                bookingDetails.push({
                    id: b._id,
                    booking_id: b.booking_id,
                    customer_name: b.customer_name,
                    package_name: b.package_id?.name || 'Custom Package',
                    amount: pkgPrice,
                    payment_status: isPaid ? 'completed' : (pay?.status || 'pending'),
                    transaction_id: pay?.transaction_id || pay?.razorpay_payment_id || null,
                    paid_at: pay?.paid_at || null,
                    created_at: b.created_at
                });
            }

            let overallPaymentStatus = 'no_bookings';
            if (sBookings.length > 0) {
                if (pendingCount === 0) {
                    overallPaymentStatus = 'all_paid';
                } else {
                    overallPaymentStatus = 'pending_payment';
                }
            }

            showroomPaymentMap[sId] = {
                total_bookings: sBookings.length,
                paid_bookings_count: paidCount,
                pending_bookings_count: pendingCount,
                total_paid_amount: totalPaid,
                total_pending_amount: totalPending,
                payment_status: overallPaymentStatus,
                bookings: bookingDetails
            };
        }

        // Search and Payment Status Filtering
        let filteredShowrooms = showroomsData;

        if (search) {
            const searchRegex = new RegExp(search, 'i');
            filteredShowrooms = filteredShowrooms.filter(s => {
                return searchRegex.test(s.name) ||
                       (s.owner_id && (searchRegex.test(s.owner_id.name) || searchRegex.test(s.owner_id.email)));
            });
        }

        if (payment_status && payment_status !== 'all') {
            filteredShowrooms = filteredShowrooms.filter(s => {
                const payStats = showroomPaymentMap[s._id.toString()];
                if (payment_status === 'paid') return payStats?.payment_status === 'all_paid';
                if (payment_status === 'pending') return payStats?.payment_status === 'pending_payment';
                return true;
            });
        }

        const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
        const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
        const offset = (parsedPage - 1) * parsedLimit;

        const total = filteredShowrooms.length;
        const paginatedShowrooms = filteredShowrooms.slice(offset, offset + parsedLimit);

        const formattedShowrooms = paginatedShowrooms.map(s => {
            const payStats = showroomPaymentMap[s._id.toString()] || {
                total_bookings: 0,
                paid_bookings_count: 0,
                pending_bookings_count: 0,
                total_paid_amount: 0,
                total_pending_amount: 0,
                payment_status: 'no_bookings',
                bookings: []
            };

            return {
                id: s._id,
                name: s.name,
                address: s.address,
                map_link: s.map_link,
                contact_number: s.contact_number,
                status: s.status,
                rejection_reason: s.rejection_reason,
                created_at: s.created_at,
                owner_id: s.owner_id ? s.owner_id._id : null,
                owner_name: s.owner_id ? s.owner_id.name : null,
                owner_email: s.owner_id ? s.owner_id.email : null,
                payment_summary: payStats
            };
        });

        res.json({
            showrooms: formattedShowrooms,
            pagination: {
                total,
                page: parsedPage,
                limit: parsedLimit,
                totalPages: Math.max(Math.ceil(total / parsedLimit), 1)
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get single showroom
// @route   GET /api/showrooms/:id
// @access  Super Admin
export const getShowroomById = async (req, res) => {
    try {
        const showroom = await Showroom.findById(req.params.id).populate('owner_id', 'name email');
        if (!showroom) return res.status(404).json({ message: 'Showroom not found' });
        
        const responseData = {
            ...showroom.toObject(),
            owner_name: showroom.owner_id ? showroom.owner_id.name : null,
            owner_email: showroom.owner_id ? showroom.owner_id.email : null
        };
        
        res.json(responseData);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Approve a showroom
// @route   PATCH /api/showrooms/:id/approve
// @access  Super Admin
export const approveShowroom = async (req, res) => {
    try {
        const showroom = await Showroom.findById(req.params.id);
        if (!showroom) return res.status(404).json({ message: 'Showroom not found' });

        showroom.status = 'approved';
        showroom.rejection_reason = undefined;
        await showroom.save();

        // Create notification for the owner
        await Notification.create({
            user_id: showroom.owner_id,
            title: 'Showroom Approved!',
            message: `Your showroom "${showroom.name}" has been approved. You can now create bookings.`
        });

        res.json({ message: 'Showroom approved successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Reject a showroom
// @route   PATCH /api/showrooms/:id/reject
// @access  Super Admin
export const rejectShowroom = async (req, res) => {
    try {
        const { reason } = req.body;
        const showroom = await Showroom.findById(req.params.id);
        if (!showroom) return res.status(404).json({ message: 'Showroom not found' });

        showroom.status = 'rejected';
        showroom.rejection_reason = reason || 'No reason provided.';
        await showroom.save();

        // Create notification for the owner
        await Notification.create({
            user_id: showroom.owner_id,
            title: 'Showroom Rejected',
            message: `Your showroom "${showroom.name}" was rejected. Reason: ${showroom.rejection_reason}`
        });

        res.json({ message: 'Showroom rejected' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update showroom details
// @route   PUT /api/showrooms/:id
// @access  Super Admin
export const updateShowroom = async (req, res) => {
    try {
        const { name, address, contact_number, map_link } = req.body;
        const showroom = await Showroom.findById(req.params.id);
        if (!showroom) return res.status(404).json({ message: 'Showroom not found' });

        showroom.name = name;
        showroom.address = address;
        showroom.contact_number = contact_number;
        showroom.map_link = map_link || null;
        await showroom.save();

        res.json({ message: 'Showroom updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete a showroom
// @route   DELETE /api/showrooms/:id
// @access  Super Admin
export const deleteShowroom = async (req, res) => {
    try {
        const showroom = await Showroom.findByIdAndDelete(req.params.id);
        if (!showroom) return res.status(404).json({ message: 'Showroom not found' });
        res.json({ message: 'Showroom deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};
