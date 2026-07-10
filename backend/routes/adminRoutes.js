import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { addVideographer, getVideographers } from '../controllers/adminController.js';

const router = express.Router();

router.use(protect);
router.use(authorize('super_admin'));

router.get('/videographers', getVideographers);
router.post('/videographers', addVideographer);

export default router;
