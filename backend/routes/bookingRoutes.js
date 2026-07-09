import express from 'express';
import multer from 'multer';
import {
    assignVideographer,
    createBooking,
    deleteAdminBooking,
    getAdminBookingById,
    getAdminBookings,
    getAssignableVideographers,
    getBookingById,
    getBookingPackages,
    getBookings,
    updateAdminBooking,
    updateBookingStatus
} from '../controllers/bookingController.js';
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

router.get('/admin/videographers', authorize('super_admin'), getAssignableVideographers);
router.get('/admin', authorize('super_admin'), getAdminBookings);
router.get('/admin/:id', authorize('super_admin'), getAdminBookingById);
router.put('/admin/:id', authorize('super_admin'), updateAdminBooking);
router.patch('/admin/:id/assign', authorize('super_admin'), assignVideographer);
router.patch('/admin/:id/status', authorize('super_admin'), updateBookingStatus);
router.delete('/admin/:id', authorize('super_admin'), deleteAdminBooking);

router.use(authorize('showroom_owner'));
router.get('/packages', getBookingPackages);
router.get('/', getBookings);
router.get('/:id', getBookingById);
router.post('/', handleVehiclePhotoUpload, createBooking);

export default router;
