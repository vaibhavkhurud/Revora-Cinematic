import express from 'express';
import multer from 'multer';
import { createBooking, getBookingPackages } from '../controllers/bookingController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { uploadVehiclePhotos } from '../middleware/uploadMiddleware.js';

const router = express.Router();

const handleVehiclePhotoUpload = (req, res, next) => {
    uploadVehiclePhotos.array('vehicle_photos', 8)(req, res, (error) => {
        if (!error) return next();

        if (error instanceof multer.MulterError) {
            if (error.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ message: 'Each vehicle photo must be 5MB or smaller.' });
            }

            if (error.code === 'LIMIT_FILE_COUNT') {
                return res.status(400).json({ message: 'You can upload up to 8 vehicle photos.' });
            }
        }

        return res.status(400).json({ message: error.message || 'Vehicle photo upload failed.' });
    });
};

router.use(protect);
router.use(authorize('showroom_owner'));

router.get('/packages', getBookingPackages);
router.post('/', handleVehiclePhotoUpload, createBooking);

export default router;
