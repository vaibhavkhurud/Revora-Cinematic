import express from 'express';
import {
    registerShowroom,
    login,
    logout,
    refreshToken,
    forgotPassword,
    resetPassword,
    sessionStream
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerShowroom);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/session-stream', sessionStream);
router.get('/check-session', protect, (req, res) => {
    res.json({ valid: true });
});

export default router;
