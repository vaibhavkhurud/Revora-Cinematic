import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
    getDashboard,
    updateShootStatus,
    getBookingDetails,
    respondToShoot,
    getEarnings,
    getWithdrawals,
    requestWithdrawal,
    getProfile,
    updateProfile
} from '../controllers/videographerController.js';

const router = express.Router();

router.use(protect);
router.use(authorize('videographer'));

router.get('/dashboard', getDashboard);
router.get('/earnings', getEarnings);
router.get('/withdrawals', getWithdrawals);
router.post('/withdrawals', requestWithdrawal);
router.get('/booking/:id', getBookingDetails);
router.put('/booking/:id/status', updateShootStatus);
router.patch('/booking/:id/respond', respondToShoot);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);

export default router;
