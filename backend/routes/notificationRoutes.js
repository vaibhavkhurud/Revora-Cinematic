import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getNotifications, getUnreadCount, markAsRead } from '../controllers/notificationController.js';

const router = express.Router();

router.use(protect); // All authenticated users can access notifications

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/all/read', markAsRead);   // Must be before /:id to avoid conflict
router.put('/:id/read', markAsRead);

export default router;
