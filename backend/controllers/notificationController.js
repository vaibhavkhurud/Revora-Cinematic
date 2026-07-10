import Notification from '../models/Notification.js';

// @desc    Get all notifications for current user
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const notifications = await Notification.find({ user_id: req.user._id })
            .sort({ created_at: -1 })
            .limit(limit);

        res.json(notifications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
export const getUnreadCount = async (req, res) => {
    try {
        const count = await Notification.countDocuments({ user_id: req.user._id, is_read: false });
        res.json({ count });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Mark notification(s) as read
// @route   PUT /api/notifications/:id/read  OR  PUT /api/notifications/all/read
// @access  Private
export const markAsRead = async (req, res) => {
    try {
        const isMarkAll = req.params.id === undefined || req.url.includes('/all/');

        if (isMarkAll || req.params.id === 'all') {
            await Notification.updateMany(
                { user_id: req.user._id, is_read: false },
                { is_read: true }
            );
            return res.json({ message: 'All notifications marked as read' });
        }

        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, user_id: req.user._id },
            { is_read: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.json({ message: 'Notification marked as read', notification });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
