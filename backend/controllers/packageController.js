import mongoose from 'mongoose';
import Package from '../models/Package.js';
import Booking from '../models/Booking.js';

const MAX_LIMIT = 50;

const isObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const normalizeBoolean = (value, fallback = true) => {
    if (value === undefined || value === null || value === '') return fallback;
    if (typeof value === 'boolean') return value;
    if (value === 'true') return true;
    if (value === 'false') return false;
    return fallback;
};

const parseFeatures = (features) => {
    if (features === undefined || features === null || features === '') return [];
    if (!Array.isArray(features)) return null;

    return features
        .map(feature => String(feature).trim())
        .filter(Boolean);
};

const serializePackage = (pkg) => ({
    id: pkg._id.toString(),
    name: pkg.name,
    description: pkg.description || '',
    price: Number(pkg.price),
    duration_minutes: Number(pkg.duration_minutes),
    features: Array.isArray(pkg.features) ? pkg.features : [],
    is_active: pkg.is_active === true,
    created_at: pkg.created_at,
    updated_at: pkg.updated_at
});

const validatePackagePayload = ({ name, description, price, duration_minutes, features }) => {
    if (!name || !String(name).trim()) {
        return 'Package name is required.';
    }

    if (String(name).trim().length > 100) {
        return 'Package name cannot exceed 100 characters.';
    }

    if (description && String(description).trim().length > 1000) {
        return 'Description cannot exceed 1000 characters.';
    }

    if (price === undefined || price === null || price === '') {
        return 'Price is required.';
    }

    if (duration_minutes === undefined || duration_minutes === null || duration_minutes === '') {
        return 'Duration is required.';
    }

    if (Number.isNaN(Number(price)) || Number(price) <= 0) {
        return 'Price must be a positive number.';
    }

    if (!Number.isInteger(Number(duration_minutes)) || Number(duration_minutes) <= 0) {
        return 'Duration must be a positive whole number.';
    }

    if (features !== undefined && !Array.isArray(features)) {
        return 'Features must be an array.';
    }

    if (Array.isArray(features) && features.some(feature => String(feature).trim().length > 160)) {
        return 'Each feature must be 160 characters or fewer.';
    }

    return null;
};

// @desc    Get all packages
// @route   GET /api/packages
// @access  Super Admin
export const getAllPackages = async (req, res) => {
    try {
        const { search, is_active, page = 1, limit = 10 } = req.query;
        const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
        const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), MAX_LIMIT);
        const offset = (parsedPage - 1) * parsedLimit;
        const query = {};

        if (is_active !== undefined && is_active !== 'all') {
            if (!['true', 'false', true, false].includes(is_active)) {
                return res.status(400).json({ message: 'is_active must be true, false, or all.' });
            }
            query.is_active = is_active === true || is_active === 'true';
        }

        if (search && String(search).trim()) {
            const safeSearch = String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            query.$or = [
                { name: { $regex: safeSearch, $options: 'i' } },
                { description: { $regex: safeSearch, $options: 'i' } }
            ];
        }

        const total = await Package.countDocuments(query);
        const packages = await Package.find(query)
            .sort({ created_at: -1 })
            .skip(offset)
            .limit(parsedLimit);

        res.json({
            packages: packages.map(serializePackage),
            pagination: {
                total,
                page: parsedPage,
                limit: parsedLimit,
                totalPages: Math.max(Math.ceil(total / parsedLimit), 1)
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get single package
// @route   GET /api/packages/:id
// @access  Super Admin
export const getPackageById = async (req, res) => {
    try {
        if (!isObjectId(req.params.id)) {
            return res.status(400).json({ message: 'Invalid package id.' });
        }

        const pkg = await Package.findById(req.params.id);
        if (!pkg) return res.status(404).json({ message: 'Package not found' });

        res.json(serializePackage(pkg));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create package
// @route   POST /api/packages
// @access  Super Admin
export const createPackage = async (req, res) => {
    try {
        const { name, description, price, duration_minutes, features, is_active } = req.body;
        const validationError = validatePackagePayload(req.body);
        if (validationError) return res.status(400).json({ message: validationError });

        const parsedFeatures = parseFeatures(features);
        if (parsedFeatures === null) return res.status(400).json({ message: 'Features must be an array.' });

        const newPackage = new Package({
            name: String(name).trim(),
            description: description ? String(description).trim() : null,
            price: Number(price),
            duration_minutes: Number(duration_minutes),
            features: parsedFeatures,
            is_active: normalizeBoolean(is_active, true)
        });

        const savedPackage = await newPackage.save();
        res.status(201).json({ message: 'Package created successfully', package: serializePackage(savedPackage) });
    } catch (error) {
        console.error(error);
        if (error.code === 11000) {
            return res.status(409).json({ message: 'A package with this name already exists.' });
        }
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update package
// @route   PUT /api/packages/:id
// @access  Super Admin
export const updatePackage = async (req, res) => {
    try {
        const { name, description, price, duration_minutes, features, is_active } = req.body;

        if (!isObjectId(req.params.id)) {
            return res.status(400).json({ message: 'Invalid package id.' });
        }

        const validationError = validatePackagePayload(req.body);
        if (validationError) return res.status(400).json({ message: validationError });

        const parsedFeatures = parseFeatures(features);
        if (parsedFeatures === null) return res.status(400).json({ message: 'Features must be an array.' });

        const pkg = await Package.findById(req.params.id);
        if (!pkg) return res.status(404).json({ message: 'Package not found' });

        pkg.name = String(name).trim();
        pkg.description = description ? String(description).trim() : null;
        pkg.price = Number(price);
        pkg.duration_minutes = Number(duration_minutes);
        pkg.features = parsedFeatures;
        pkg.is_active = normalizeBoolean(is_active, true);

        await pkg.save();
        res.json({ message: 'Package updated successfully', package: serializePackage(pkg) });
    } catch (error) {
        console.error(error);
        if (error.code === 11000) {
            return res.status(409).json({ message: 'A package with this name already exists.' });
        }
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Toggle active status
// @route   PATCH /api/packages/:id/toggle
// @access  Super Admin
export const togglePackageStatus = async (req, res) => {
    try {
        if (!isObjectId(req.params.id)) {
            return res.status(400).json({ message: 'Invalid package id.' });
        }

        const pkg = await Package.findById(req.params.id);
        if (!pkg) return res.status(404).json({ message: 'Package not found' });

        pkg.is_active = !pkg.is_active;
        await pkg.save();

        res.json({
            message: `Package ${pkg.is_active ? 'activated' : 'deactivated'} successfully`,
            package: serializePackage(pkg)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Activate package
// @route   PATCH /api/packages/:id/activate
// @access  Super Admin
export const activatePackage = async (req, res) => {
    try {
        if (!isObjectId(req.params.id)) {
            return res.status(400).json({ message: 'Invalid package id.' });
        }

        const pkg = await Package.findById(req.params.id);
        if (!pkg) return res.status(404).json({ message: 'Package not found' });

        pkg.is_active = true;
        await pkg.save();

        res.json({ message: 'Package activated successfully', package: serializePackage(pkg) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete package
// @route   DELETE /api/packages/:id
// @access  Super Admin
export const deletePackage = async (req, res) => {
    try {
        if (!isObjectId(req.params.id)) {
            return res.status(400).json({ message: 'Invalid package id.' });
        }

        const bookingCount = await Booking.countDocuments({ package_id: req.params.id });
        if (bookingCount > 0) {
            return res.status(400).json({ message: 'Cannot delete package because it is linked to existing bookings.' });
        }

        const pkg = await Package.findByIdAndDelete(req.params.id);
        if (!pkg) return res.status(404).json({ message: 'Package not found' });

        res.json({ message: 'Package deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
