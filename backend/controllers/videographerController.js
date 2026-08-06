import Booking from '../models/Booking.js';
import Videographer from '../models/Videographer.js';
import BookingImage from '../models/BookingImage.js';
import BookingActivity from '../models/BookingActivity.js';
import Notification from '../models/Notification.js';
import Showroom from '../models/Showroom.js';
import User from '../models/User.js';
import Package from '../models/Package.js';
import Withdrawal from '../models/Withdrawal.js';

// @desc    Get videographer dashboard data
// @route   GET /api/videographer/dashboard
// @access  Private/Videographer
export const getDashboard = async (req, res) => {
    try {
        const videographer = await Videographer.findOne({ user_id: req.user._id });
        if (!videographer) {
             return res.status(404).json({ message: 'Videographer profile not found' });
        }

        const bookings = await Booking.find({ videographer_id: videographer._id })
            .populate('package_id', 'name price videographer_share')
            .populate('showroom_id', 'name address map_link')
            .sort({ booking_date: 1 });

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const dashboardData = {
            stats: {
                todayShots: 0,
                upcoming: 0,
                pending: 0,
                completed: 0,
                awaitingResponse: 0
            },
            awaitingResponse: [],
            today: [],
            upcoming: [],
            pending: [],
            completed: []
        };

        const bookingIds = bookings.map(b => b._id);
        const allImages = await BookingImage.find({ booking_id: { $in: bookingIds } });
        
        const imageMap = {};
        allImages.forEach(img => {
            if (!imageMap[img.booking_id]) {
                imageMap[img.booking_id] = img.image_url;
            }
        });

        bookings.forEach(booking => {
            const bookingDate = new Date(booking.booking_date);
            const isToday = bookingDate >= today && bookingDate < new Date(today.getTime() + 86400000);
            
            let imageUrl = imageMap[booking._id];
            const finalImage = imageUrl 
                ? (imageUrl.startsWith('http') ? imageUrl : `http://localhost:5000${imageUrl}`) 
                : 'https://images.unsplash.com/photo-1611339555312-e607c04352fd?w=400&h=300&fit=crop';

            const item = {
                id: booking._id,
                customer: booking.customer_name,
                vehicle: `${booking.vehicle_brand} ${booking.vehicle_model}`,
                location: booking.showroom_id?.address || 'Client Location',
                map_link: booking.showroom_id?.map_link || null,
                date: bookingDate.toLocaleDateString(),
                time: booking.time_slot,
                status: booking.status,
                videographer_response: booking.videographer_response,
                image: finalImage,
                notes: booking.notes,
                package_name: booking.package_id?.name || 'N/A',
                package_price: booking.package_id?.videographer_share !== undefined && booking.package_id?.videographer_share !== null
                    ? booking.package_id.videographer_share
                    : Math.round((booking.package_id?.price || 0) * 0.6)
            };

            // Shoots awaiting videographer response (assigned but not yet accepted/rejected)
            if (booking.status === 'assigned' && booking.videographer_response === 'pending') {
                item.status = 'awaiting_response';
                dashboardData.awaitingResponse.push(item);
                dashboardData.stats.awaitingResponse++;
                return;
            }

            // Status mapping for dashboard (only for accepted shoots)
            if (['pending', 'assigned'].includes(booking.status)) {
                if (isToday) {
                    item.status = 'ready';
                    dashboardData.today.push(item);
                    dashboardData.stats.todayShots++;
                } else if (bookingDate > now) {
                    item.status = 'scheduled';
                    dashboardData.upcoming.push(item);
                    dashboardData.stats.upcoming++;
                }
            } else if (['arrived', 'shooting'].includes(booking.status)) {
                item.status = 'in_progress';
                dashboardData.today.push(item);
                dashboardData.stats.todayShots++;
            } else if (booking.status === 'editing') {
                item.status = 'pending_upload';
                dashboardData.pending.push(item);
                dashboardData.stats.pending++;
            } else if (booking.status === 'completed') {
                item.status = 'completed';
                dashboardData.completed.push(item);
                dashboardData.stats.completed++;
            }
        });

        res.json(dashboardData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Videographer responds to shoot assignment (accept/reject)
// @route   PATCH /api/videographer/booking/:id/respond
// @access  Private/Videographer
export const respondToShoot = async (req, res) => {
    try {
        const { response, note } = req.body;

        if (!['accepted', 'rejected'].includes(response)) {
            return res.status(400).json({ message: 'Response must be "accepted" or "rejected".' });
        }

        const videographer = await Videographer.findOne({ user_id: req.user._id });
        if (!videographer) {
            return res.status(404).json({ message: 'Videographer profile not found' });
        }

        const booking = await Booking.findById(req.params.id)
            .populate('package_id', 'name price videographer_share');
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (!booking.videographer_id || booking.videographer_id.toString() !== videographer._id.toString()) {
            return res.status(403).json({ message: 'Not authorized for this booking' });
        }

        if (booking.videographer_response !== 'pending') {
            return res.status(400).json({ message: 'You have already responded to this booking.' });
        }

        booking.videographer_response = response;
        booking.videographer_response_note = note ? String(note).trim().slice(0, 500) : null;

        if (response === 'rejected') {
            // Reset booking back to unassigned pending
            booking.videographer_id = null;
            booking.status = 'pending';
            videographer.status = 'available';
            await videographer.save();
        }

        await booking.save();

        // Log activity
        await new BookingActivity({
            booking_id: booking._id,
            user_id: req.user._id,
            action: response === 'accepted' ? 'Shoot Accepted' : 'Shoot Rejected',
            details: response === 'rejected' && note
                ? `Videographer rejected the shoot. Reason: ${note}`
                : `Videographer ${response} the shoot assignment.`
        }).save();

        // Notify all super_admins
        try {
            const superAdmins = await User.find({ role: 'super_admin' });
            const vehicle = `${booking.vehicle_brand} ${booking.vehicle_model}`;
            const notifTitle = response === 'accepted'
                ? '✅ Shoot Accepted'
                : '❌ Shoot Rejected';
            const notifMessage = response === 'accepted'
                ? `${req.user.name} accepted the shoot assignment for ${vehicle} (${booking.registration_number}).`
                : `${req.user.name} rejected the shoot for ${vehicle} (${booking.registration_number}).${note ? ` Reason: ${note}` : ''}`;

            const notifications = superAdmins.map(admin => ({
                user_id: admin._id,
                title: notifTitle,
                message: notifMessage
            }));
            if (notifications.length > 0) {
                await Notification.insertMany(notifications);
            }
        } catch (notifErr) {
            console.error('Notification error:', notifErr);
        }

        res.json({ message: `Shoot ${response} successfully.`, booking });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update booking status
// @route   PUT /api/videographer/booking/:id/status
// @access  Private/Videographer
export const updateShootStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        const videographer = await Videographer.findOne({ user_id: req.user._id });
        if (!videographer || booking.videographer_id.toString() !== videographer._id.toString()) {
            return res.status(403).json({ message: 'Not authorized for this booking' });
        }

        if (booking.videographer_response !== 'accepted') {
            return res.status(400).json({ message: 'You must accept this shoot before updating its status.' });
        }

        const oldStatus = booking.status;
        booking.status = status;
        await booking.save();

        // Log activity
        await new BookingActivity({
            booking_id: booking._id,
            user_id: req.user._id,
            action: 'Status Updated',
            details: `Status changed from ${oldStatus} to ${status}`
        }).save();

        // Send notification to showroom owner based on status
        try {
            const showroom = await Showroom.findById(booking.showroom_id);
            if (showroom) {
                let notifTitle = null;
                let notifMessage = null;

                if (status === 'arrived') {
                    notifTitle = '📍 Videographer Arrived';
                    notifMessage = `Your videographer has arrived at the location for the ${booking.vehicle_brand} ${booking.vehicle_model} shoot.`;
                } else if (status === 'shooting') {
                    notifTitle = '🎬 Shoot Started';
                    notifMessage = `The cinematic shoot has started for ${booking.vehicle_brand} ${booking.vehicle_model} (${booking.registration_number}).`;
                } else if (status === 'editing') {
                    notifTitle = '✅ Shoot Completed';
                    notifMessage = `The shoot for ${booking.vehicle_brand} ${booking.vehicle_model} is complete. Your video is now being edited.`;
                } else if (status === 'completed') {
                    notifTitle = '🎥 Video Uploaded';
                    notifMessage = `Your final video for ${booking.vehicle_brand} ${booking.vehicle_model} is ready!`;
                }

                if (notifTitle) {
                    await new Notification({
                        user_id: showroom.owner_id,
                        title: notifTitle,
                        message: notifMessage
                    }).save();
                }
            }
        } catch (notifErr) {
            console.error('Notification error:', notifErr);
        }

        res.json({ message: 'Status updated successfully', booking });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get single booking details
// @route   GET /api/videographer/booking/:id
// @access  Private/Videographer
export const getBookingDetails = async (req, res) => {
    try {
        const videographer = await Videographer.findOne({ user_id: req.user._id });
        if (!videographer) {
            return res.status(404).json({ message: 'Videographer profile not found' });
        }

        const booking = await Booking.findById(req.params.id)
            .populate('package_id', 'name duration_minutes features price videographer_share')
            .populate('showroom_id', 'name address map_link contact_number');

        if (!booking || booking.videographer_id.toString() !== videographer._id.toString()) {
            return res.status(404).json({ message: 'Booking not found or not authorized' });
        }

        const images = await BookingImage.find({ booking_id: booking._id });
        const activities = await BookingActivity.find({ booking_id: booking._id })
            .populate('user_id', 'name role')
            .sort({ created_at: -1 });

        const bookingObj = booking.toObject();
        if (bookingObj.package_id) {
            bookingObj.package_id.price = bookingObj.package_id.videographer_share !== undefined && bookingObj.package_id.videographer_share !== null
                ? bookingObj.package_id.videographer_share
                : Math.round((bookingObj.package_id.price || 0) * 0.6);
        }

        res.json({
            booking: bookingObj,
            images,
            activities
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get videographer earnings
// @route   GET /api/videographer/earnings
// @access  Private/Videographer
export const getEarnings = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const videographer = await Videographer.findOne({ user_id: req.user._id });
        if (!videographer) {
            return res.status(404).json({ message: 'Videographer profile not found' });
        }

        let dateFilter = {};
        if (startDate || endDate) {
            dateFilter.updated_at = {};
            if (startDate) dateFilter.updated_at.$gte = new Date(startDate);
            if (endDate) dateFilter.updated_at.$lte = new Date(endDate);
        }

        const completedBookings = await Booking.find({
            videographer_id: videographer._id,
            status: 'completed',
            ...dateFilter
        }).populate('package_id', 'name price videographer_share').sort({ updated_at: -1 });

        // Calculate totals
        let totalEarnings = 0;
        const packageBreakdown = {};
        const recentBookings = [];

        completedBookings.forEach(booking => {
            const rawPrice = booking.package_id?.price || 0;
            const price = booking.package_id?.videographer_share !== undefined && booking.package_id?.videographer_share !== null
                ? booking.package_id.videographer_share
                : Math.round(rawPrice * 0.6);
            
            const packageName = booking.package_id?.name || 'Unknown Package';
            const packageId = booking.package_id?._id?.toString() || 'unknown';

            totalEarnings += price;

            if (!packageBreakdown[packageId]) {
                packageBreakdown[packageId] = {
                    package_id: packageId,
                    package_name: packageName,
                    count: 0,
                    price_per_shoot: price,
                    total: 0
                };
            }
            packageBreakdown[packageId].count++;
            packageBreakdown[packageId].total += price;

            recentBookings.push({
                id: booking._id,
                customer: booking.customer_name,
                vehicle: `${booking.vehicle_brand} ${booking.vehicle_model}`,
                package_name: packageName,
                amount: price,
                date: booking.updated_at || booking.created_at
            });
        });

        res.json({
            total_earnings: totalEarnings,
            completed_shoots: completedBookings.length,
            package_breakdown: Object.values(packageBreakdown).sort((a, b) => b.total - a.total),
            recent_bookings: recentBookings.slice(0, 20)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get videographer withdrawal history and balance
// @route   GET /api/videographer/withdrawals
// @access  Private/Videographer
export const getWithdrawals = async (req, res) => {
    try {
        const videographer = await Videographer.findOne({ user_id: req.user._id });
        if (!videographer) return res.status(404).json({ message: 'Videographer profile not found' });

        const withdrawals = await Withdrawal.find({ videographer_id: videographer._id }).sort({ requested_at: -1 });
        
        // Calculate total earnings from completed shoots
        const completedBookings = await Booking.find({
            videographer_id: videographer._id,
            status: 'completed'
        }).populate('package_id', 'price videographer_share');

        let totalEarnings = 0;
        completedBookings.forEach(booking => {
            const price = booking.package_id?.price || 0;
            const videographerShare = booking.package_id?.videographer_share !== undefined && booking.package_id?.videographer_share !== null
                ? booking.package_id.videographer_share
                : Math.round(price * 0.6);
            totalEarnings += videographerShare;
        });

        // Calculate withdrawn and pending amounts
        let totalWithdrawn = 0;
        let pendingAmount = 0;

        withdrawals.forEach(w => {
            if (w.status === 'completed') totalWithdrawn += w.amount;
            if (w.status === 'pending' || w.status === 'approved') pendingAmount += w.amount;
        });

        const availableBalance = totalEarnings - totalWithdrawn - pendingAmount;

        res.json({
            withdrawals,
            stats: {
                total_earnings: totalEarnings,
                total_withdrawn: totalWithdrawn,
                pending_amount: pendingAmount,
                available_balance: availableBalance > 0 ? availableBalance : 0
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Request a new withdrawal
// @route   POST /api/videographer/withdrawals
// @access  Private/Videographer
export const requestWithdrawal = async (req, res) => {
    try {
        const { amount, payment_method } = req.body;
        
        if (!amount || amount < 100) {
            return res.status(400).json({ message: 'Minimum withdrawal amount is ₹100' });
        }

        const videographer = await Videographer.findOne({ user_id: req.user._id });
        if (!videographer) return res.status(404).json({ message: 'Videographer profile not found' });

        // Ensure payout profile is set up
        if (!videographer.payout_profile || (!videographer.payout_profile.upi_id && !videographer.payout_profile.account_number)) {
            return res.status(400).json({ message: 'Please update your payout details in your profile before requesting a withdrawal.' });
        }

        // Validate available balance (recalculate to prevent tampering)
        const completedBookings = await Booking.find({ videographer_id: videographer._id, status: 'completed' })
            .populate('package_id', 'price videographer_share');
            
        let totalEarnings = 0;
        completedBookings.forEach(booking => {
            const price = booking.package_id?.price || 0;
            const videographerShare = booking.package_id?.videographer_share !== undefined && booking.package_id?.videographer_share !== null
                ? booking.package_id.videographer_share
                : Math.round(price * 0.6);
            totalEarnings += videographerShare;
        });

        const withdrawals = await Withdrawal.find({ videographer_id: videographer._id });
        let usedAmount = 0;
        withdrawals.forEach(w => {
            if (['pending', 'approved', 'completed'].includes(w.status)) {
                usedAmount += w.amount;
            }
        });

        const availableBalance = totalEarnings - usedAmount;

        if (amount > availableBalance) {
            return res.status(400).json({ message: `Requested amount exceeds available balance (₹${availableBalance})` });
        }

        // Create the withdrawal request
        const withdrawal = new Withdrawal({
            videographer_id: videographer._id,
            amount,
            payment_method,
            payout_details: videographer.payout_profile // Snapshot of current details
        });

        await withdrawal.save();

        // Notify Admin
        const adminUsers = await User.find({ role: 'super_admin' });
        for (const admin of adminUsers) {
            await new Notification({
                user_id: admin._id,
                title: 'New Withdrawal Request',
                message: `Videographer ${req.user.name} requested a withdrawal of ₹${amount}.`
            }).save();
        }

        res.status(201).json({ message: 'Withdrawal requested successfully', withdrawal });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get Videographer Profile
// @route   GET /api/videographer/profile
// @access  Private/Videographer
export const getProfile = async (req, res) => {
    try {
        const videographer = await Videographer.findOne({ user_id: req.user._id }).populate('user_id', 'name email');
        if (!videographer) return res.status(404).json({ message: 'Videographer profile not found' });
        
        res.json({
            name: videographer.user_id.name,
            email: videographer.user_id.email,
            phone: videographer.phone,
            address: videographer.address,
            payout_profile: videographer.payout_profile || {}
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update Videographer Profile
// @route   PUT /api/videographer/profile
// @access  Private/Videographer
export const updateProfile = async (req, res) => {
    try {
        const { phone, address, payout_profile } = req.body;
        
        const videographer = await Videographer.findOne({ user_id: req.user._id });
        if (!videographer) return res.status(404).json({ message: 'Videographer profile not found' });
        
        if (phone) videographer.phone = phone;
        if (address) videographer.address = address;
        
        if (payout_profile) {
            videographer.payout_profile = {
                ...videographer.payout_profile,
                ...payout_profile
            };
        }
        
        await videographer.save();
        
        res.json({
            message: 'Profile updated successfully',
            profile: {
                phone: videographer.phone,
                address: videographer.address,
                payout_profile: videographer.payout_profile
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
