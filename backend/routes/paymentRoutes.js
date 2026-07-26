import express from 'express';
import { createPaymentOrder, verifyPaymentSignature } from '../controllers/paymentController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply auth protection to all payment routes
router.use(protect);
router.use(authorize('showroom_owner'));

router.post('/create-order', createPaymentOrder);
router.post('/verify', verifyPaymentSignature);

export default router;
