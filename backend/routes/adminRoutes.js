import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { addVideographer, getVideographers, resetVideographerPassword, getVideographerReport } from '../controllers/adminController.js';

const router = express.Router();

router.use(protect);
router.use(authorize('super_admin'));

router.get('/videographers', getVideographers);
router.post('/videographers', addVideographer);
router.put('/videographers/:id/reset-password', resetVideographerPassword);
router.get('/videographers/:id/report', getVideographerReport);

export default router;
