import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
    getOverview,
    getMonthlyData,
    getPackageStats,
    getVideographerPerformance,
    getStatusBreakdown
} from '../controllers/analyticsController.js';

const router = express.Router();

router.use(protect);
router.use(authorize('super_admin'));

router.get('/overview', getOverview);
router.get('/monthly', getMonthlyData);
router.get('/packages', getPackageStats);
router.get('/videographers', getVideographerPerformance);
router.get('/status', getStatusBreakdown);

export default router;
