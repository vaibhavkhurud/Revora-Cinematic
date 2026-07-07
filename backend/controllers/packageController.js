import db from '../config/db.js';

const parseFeatures = (features) => {
    if (features === undefined || features === null || features === '') return [];
    if (!Array.isArray(features)) return null;

    return features
        .map(feature => String(feature).trim())
        .filter(Boolean);
};

const serializePackage = (pkg) => ({
    ...pkg,
    features: Array.isArray(pkg.features) ? pkg.features : (pkg.features ? JSON.parse(pkg.features) : []),
    price: Number(pkg.price),
    is_active: pkg.is_active === 1 || pkg.is_active === true
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

        let query = `SELECT * FROM packages WHERE 1=1`;
        const params = [];

        if (is_active !== undefined && is_active !== 'all') {
            query += ` AND is_active = ?`;
            params.push(is_active === 'true' ? 1 : 0);
        }

        if (search) {
            query += ` AND (name LIKE ? OR description LIKE ?)`;
            const like = `%${search}%`;
            params.push(like, like);
        }

        const countQuery = `SELECT COUNT(*) as total FROM (${query}) as t`;
        const [countResult] = await db.execute(countQuery, params);
        const total = countResult[0].total;

        query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), offset);

        const [packages] = await db.execute(query, params);

        // Parse features JSON
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
        const [rows] = await db.execute('SELECT * FROM packages WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Package not found' });
        res.json(serializePackage(rows[0]));
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
        const featuresJson = JSON.stringify(parsedFeatures);

        const [result] = await db.execute(
            `INSERT INTO packages (name, description, price, duration_minutes, features, is_active) VALUES (?, ?, ?, ?, ?, ?)`,
            [String(name).trim(), description || null, Number(price), Number(duration_minutes), featuresJson, is_active !== false ? 1 : 0]
        );

        res.status(201).json({ message: 'Package created successfully', id: result.insertId });
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
        const featuresJson = JSON.stringify(parsedFeatures);

        const [result] = await db.execute(
            `UPDATE packages SET name=?, description=?, price=?, duration_minutes=?, features=?, is_active=? WHERE id=?`,
            [String(name).trim(), description || null, Number(price), Number(duration_minutes), featuresJson, is_active ? 1 : 0, req.params.id]
        );

        if (result.affectedRows === 0) return res.status(404).json({ message: 'Package not found' });
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
        const [rows] = await db.execute('SELECT is_active FROM packages WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Package not found' });

        const newStatus = rows[0].is_active ? 0 : 1;
        await db.execute('UPDATE packages SET is_active = ? WHERE id = ?', [newStatus, req.params.id]);

        res.json({ message: `Package ${newStatus ? 'activated' : 'deactivated'} successfully`, is_active: !!newStatus });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Activate package
// @route   PATCH /api/packages/:id/activate
// @access  Super Admin
export const activatePackage = async (req, res) => {
    try {
        const [result] = await db.execute('UPDATE packages SET is_active = 1 WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Package not found' });

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
        const [bookings] = await db.execute('SELECT id FROM bookings WHERE package_id = ? LIMIT 1', [req.params.id]);
        if (bookings.length > 0) {
            return res.status(400).json({ message: 'Cannot delete package — it is linked to existing bookings.' });
        }

        const [result] = await db.execute('DELETE FROM packages WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Package not found' });
        res.json({ message: 'Package deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};
