import Booking from '../models/Booking.js';
import Videographer from '../models/Videographer.js';
import BookingImage from '../models/BookingImage.js';
import BookingActivity from '../models/BookingActivity.js';
import Notification from '../models/Notification.js';
import Showroom from '../models/Showroom.js';
import User from '../models/User.js';
import Package from '../models/Package.js';

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
            .populate('package_id', 'name price')
            .populate('showroom_id', 'name address')
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
                date: bookingDate.toLocaleDateString(),
                time: booking.time_slot,
                status: booking.status,
                videographer_response: booking.videographer_response,
                image: finalImage,
                notes: booking.notes,
                package_name: booking.package_id?.name || 'N/A',
                package_price: booking.package_id?.price || 0
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
            .populate('package_id', 'name price');
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
            .populate('package_id', 'name duration_minutes features price')
            .populate('showroom_id', 'name address contact_number');

        if (!booking || booking.videographer_id.toString() !== videographer._id.toString()) {
            return res.status(404).json({ message: 'Booking not found or not authorized' });
        }

        const images = await BookingImage.find({ booking_id: booking._id });
        const activities = await BookingActivity.find({ booking_id: booking._id })
            .populate('user_id', 'name role')
            .sort({ created_at: -1 });

        res.json({
            booking,
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
        const videographer = await Videographer.findOne({ user_id: req.user._id });
        if (!videographer) {
            return res.status(404).json({ message: 'Videographer profile not found' });
        }

        const completedBookings = await Booking.find({
            videographer_id: videographer._id,
            status: 'completed'
        }).populate('package_id', 'name price').sort({ updated_at: -1 });

        // Calculate totals
        let totalEarnings = 0;
        const packageBreakdown = {};
        const recentBookings = [];

        completedBookings.forEach(booking => {
            const price = booking.package_id?.price || 0;
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
