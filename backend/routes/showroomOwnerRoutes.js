import express from 'express';
import { getShowroomOwnerDashboard, getShowroomProfile, updateShowroomLocation, updateShowroomProfile } from '../controllers/showroomOwnerController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('showroom_owner'));

router.get('/dashboard', getShowroomOwnerDashboard);
router.get('/profile', getShowroomProfile);
router.put('/profile', updateShowroomProfile);
router.put('/location', updateShowroomLocation);

export default router;
