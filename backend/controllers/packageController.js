import Package from '../models/Package.js';
import Booking from '../models/Booking.js';

const parseFeatures = (features) => {
    if (features === undefined || features === null || features === '') return [];
    if (!Array.isArray(features)) return null;

    return features
        .map(feature => String(feature).trim())
        .filter(Boolean);
};

const serializePackage = (pkg) => ({
    ...pkg.toObject(),
    price: Number(pkg.price),
    is_active: pkg.is_active === true
});

const validatePackagePayload = ({ name, price, duration_minutes, features }) => {
    if (!name || !String(name).trim()) {
        return 'Package name is required.';
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

    return null;
};

// @desc    Get all packages
// @route   GET /api/packages
// @access  Protected (all roles)
export const getAllPackages = async (req, res) => {
    try {
        const { search, is_active, page = 1, limit = 10 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let query = {};

        if (is_active !== undefined && is_active !== 'all') {
            query.is_active = is_active === 'true';
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const total = await Package.countDocuments(query);
        const packages = await Package.find(query)
            .sort({ created_at: -1 })
            .skip(offset)
            .limit(parseInt(limit));

        const parsed = packages.map(serializePackage);

        res.json({ packages: parsed, pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get single package
// @route   GET /api/packages/:id
// @access  Protected
export const getPackageById = async (req, res) => {
    try {
        const pkg = await Package.findById(req.params.id);
        if (!pkg) return res.status(404).json({ message: 'Package not found' });
        res.json(serializePackage(pkg));
    } catch (error) {
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
            description: description || null,
            price: Number(price),
            duration_minutes: Number(duration_minutes),
            features: parsedFeatures,
            is_active: is_active !== false
        });

        const savedPackage = await newPackage.save();

        res.status(201).json({ message: 'Package created successfully', id: savedPackage._id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update package
// @route   PUT /api/packages/:id
// @access  Super Admin
export const updatePackage = async (req, res) => {
    try {
        const { name, description, price, duration_minutes, features, is_active } = req.body;

        const validationError = validatePackagePayload(req.body);
        if (validationError) return res.status(400).json({ message: validationError });

        const parsedFeatures = parseFeatures(features);
        if (parsedFeatures === null) return res.status(400).json({ message: 'Features must be an array.' });

        const pkg = await Package.findById(req.params.id);
        if (!pkg) return res.status(404).json({ message: 'Package not found' });

        pkg.name = String(name).trim();
        pkg.description = description || null;
        pkg.price = Number(price);
        pkg.duration_minutes = Number(duration_minutes);
        pkg.features = parsedFeatures;
        pkg.is_active = is_active ? true : false;

        await pkg.save();

        res.json({ message: 'Package updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Toggle active status
// @route   PATCH /api/packages/:id/toggle
// @access  Super Admin
export const togglePackageStatus = async (req, res) => {
    try {
        const pkg = await Package.findById(req.params.id);
        if (!pkg) return res.status(404).json({ message: 'Package not found' });

        pkg.is_active = !pkg.is_active;
        await pkg.save();

        res.json({ message: `Package ${pkg.is_active ? 'activated' : 'deactivated'} successfully`, is_active: pkg.is_active });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Activate package
// @route   PATCH /api/packages/:id/activate
// @access  Super Admin
export const activatePackage = async (req, res) => {
    try {
        const pkg = await Package.findById(req.params.id);
        if (!pkg) return res.status(404).json({ message: 'Package not found' });

        pkg.is_active = true;
        await pkg.save();

        res.json({ message: 'Package activated successfully', is_active: true });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete package
// @route   DELETE /api/packages/:id
// @access  Super Admin
export const deletePackage = async (req, res) => {
    try {
        // Prevent deletion if package is used in bookings
        const bookingCount = await Booking.countDocuments({ package_id: req.params.id });
        if (bookingCount > 0) {
            return res.status(400).json({ message: 'Cannot delete package — it is linked to existing bookings.' });
        }

        const pkg = await Package.findByIdAndDelete(req.params.id);
        if (!pkg) return res.status(404).json({ message: 'Package not found' });
        res.json({ message: 'Package deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};
