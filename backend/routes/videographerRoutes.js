import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
    getDashboard,
    updateShootStatus,
    getBookingDetails,
    respondToShoot,
    getEarnings
} from '../controllers/videographerController.js';

const router = express.Router();

router.use(protect);
router.use(authorize('videographer'));

router.get('/dashboard', getDashboard);
router.get('/earnings', getEarnings);
router.get('/booking/:id', getBookingDetails);
router.put('/booking/:id/status', updateShootStatus);
router.patch('/booking/:id/respond', respondToShoot);

export default router;
