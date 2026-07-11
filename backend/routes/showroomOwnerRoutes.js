import express from 'express';
import { getShowroomOwnerDashboard, getShowroomProfile } from '../controllers/showroomOwnerController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('showroom_owner'));

router.get('/dashboard', getShowroomOwnerDashboard);
router.get('/profile', getShowroomProfile);

export default router;
