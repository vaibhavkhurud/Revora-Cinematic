import express from 'express';
import { getShowroomOwnerDashboard } from '../controllers/showroomOwnerController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('showroom_owner'));

router.get('/dashboard', getShowroomOwnerDashboard);

export default router;
