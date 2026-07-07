import express from 'express';
import {
    getAllShowrooms,
    getShowroomById,
    approveShowroom,
    rejectShowroom,
    updateShowroom,
    deleteShowroom
} from '../controllers/showroomController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication + super_admin role
router.use(protect);
router.use(authorize('super_admin'));

router.get('/', getAllShowrooms);
router.get('/:id', getShowroomById);
router.put('/:id', updateShowroom);
router.delete('/:id', deleteShowroom);
router.patch('/:id/approve', approveShowroom);
router.patch('/:id/reject', rejectShowroom);

export default router;
