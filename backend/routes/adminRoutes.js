import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { 
    addVideographer, 
    getVideographers, 
    resetVideographerPassword, 
    getVideographerReport,
    getAdminProfile,
    updateAdminProfile,
    changeAdminPassword,
    getSystemSettings,
    updateSystemSettings,
    getAllWithdrawals,
    updateWithdrawalStatus
} from '../controllers/adminController.js';

const router = express.Router();

router.use(protect);
router.use(authorize('super_admin'));

router.get('/videographers', getVideographers);
router.post('/videographers', addVideographer);
router.put('/videographers/:id/reset-password', resetVideographerPassword);
router.get('/videographers/:id/report', getVideographerReport);

router.get('/profile', getAdminProfile);
router.put('/profile', updateAdminProfile);
router.put('/change-password', changeAdminPassword);
router.get('/system-settings', getSystemSettings);
router.put('/system-settings', updateSystemSettings);

router.get('/withdrawals', getAllWithdrawals);
router.patch('/withdrawals/:id/status', updateWithdrawalStatus);

export default router;
