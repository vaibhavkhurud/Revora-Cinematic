import express from 'express';
import {
    getAllPackages,
    getPackageById,
    createPackage,
    updatePackage,
    activatePackage,
    togglePackageStatus,
    deletePackage
} from '../controllers/packageController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('super_admin'));

router.get('/', getAllPackages);
router.get('/:id', getPackageById);
router.post('/', createPackage);
router.put('/:id', updatePackage);
router.patch('/:id/activate', activatePackage);
router.patch('/:id/toggle', togglePackageStatus);
router.delete('/:id', deletePackage);

export default router;
