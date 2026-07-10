import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { checkIn, checkOut, getAttendanceHistory } from '../controllers/attendanceController.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);
router.use(authorize('videographer'));

router.post('/check-in', checkIn);
router.put('/check-out', checkOut);
router.get('/', getAttendanceHistory);

export default router;
