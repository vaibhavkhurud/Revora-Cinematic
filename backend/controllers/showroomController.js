import Showroom from '../models/Showroom.js';
import Notification from '../models/Notification.js';

// @desc    Get all showrooms with owner info + filters
// @route   GET /api/showrooms
// @access  Super Admin
export const getAllShowrooms = async (req, res) => {
    try {
        const { status, search, page = 1, limit = 10 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

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
        
        // Manual search filtering after population because Mongoose doesn't support regex search on populated fields easily in a single query
        let filteredShowrooms = showroomsData;
        if (search) {
            const searchRegex = new RegExp(search, 'i');
            filteredShowrooms = showroomsData.filter(s => {
                return searchRegex.test(s.name) ||
                       (s.owner_id && (searchRegex.test(s.owner_id.name) || searchRegex.test(s.owner_id.email)));
            });
        }

        const total = filteredShowrooms.length;
        const paginatedShowrooms = filteredShowrooms.slice(offset, offset + parseInt(limit));

        const formattedShowrooms = paginatedShowrooms.map(s => ({
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
            owner_email: s.owner_id ? s.owner_id.email : null
        }));

        res.json({
            showrooms: formattedShowrooms,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
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
