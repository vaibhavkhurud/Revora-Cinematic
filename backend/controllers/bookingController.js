import fs from 'fs';
import path from 'path';
import db from '../config/db.js';

const requiredFields = [
    'customer_name',
    'customer_mobile',
    'vehicle_brand',
    'vehicle_model',
    'vehicle_type',
    'vehicle_color',
    'registration_number',
    'package_id',
    'shoot_date',
    'time_slot'
];

const removeUploadedFiles = (files = []) => {
    files.forEach((file) => {
        fs.unlink(file.path, () => {});
    });
};

const normalizeText = (value) => String(value || '').trim();

const validateBookingPayload = (body, files = []) => {
    for (const field of requiredFields) {
        if (!normalizeText(body[field])) {
            return `${field.replace(/_/g, ' ')} is required.`;
        }
    }

    const mobile = normalizeText(body.customer_mobile);
    if (!/^[0-9+\-\s()]{7,20}$/.test(mobile)) {
        return 'Customer mobile number is invalid.';
    }

    const shootDate = new Date(`${body.shoot_date}T${body.time_slot}`);
    if (Number.isNaN(shootDate.getTime())) {
        return 'Shoot date and time slot are invalid.';
    }

    if (shootDate < new Date()) {
        return 'Shoot date and time slot must be in the future.';
    }

    if (!files.length) {
        return 'At least one vehicle photo is required.';
    }

    return null;
};

const getOwnerShowroom = async (connection, userId) => {
    const [rows] = await connection.execute(
        `SELECT id, status
         FROM showrooms
         WHERE owner_id = ?
         LIMIT 1`,
        [userId]
    );

    return rows[0] || null;
};

// @desc    Get active packages for booking form
// @route   GET /api/bookings/packages
// @access  Showroom Owner
export const getBookingPackages = async (req, res) => {
    try {
        const [packages] = await db.execute(
            `SELECT id, name, description, price, duration_minutes, features
             FROM packages
             WHERE is_active = 1
             ORDER BY price ASC`
        );

        res.json({
            packages: packages.map(pkg => ({
                ...pkg,
                price: Number(pkg.price),
                features: Array.isArray(pkg.features) ? pkg.features : (pkg.features ? JSON.parse(pkg.features) : [])
            }))
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create a showroom booking
// @route   POST /api/bookings
// @access  Showroom Owner
export const createBooking = async (req, res) => {
    const validationError = validateBookingPayload(req.body, req.files);
    if (validationError) {
        removeUploadedFiles(req.files);
        return res.status(400).json({ message: validationError });
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const showroom = await getOwnerShowroom(connection, req.user.id);
        if (!showroom) {
            removeUploadedFiles(req.files);
            await connection.rollback();
            return res.status(404).json({ message: 'Showroom profile not found.' });
        }

        if (showroom.status !== 'approved') {
            removeUploadedFiles(req.files);
            await connection.rollback();
            return res.status(403).json({ message: 'Your showroom must be approved before creating bookings.' });
        }

        const [packageRows] = await connection.execute(
            `SELECT id, name, price, duration_minutes
             FROM packages
             WHERE id = ? AND is_active = 1
             LIMIT 1`,
            [req.body.package_id]
        );

        if (packageRows.length === 0) {
            removeUploadedFiles(req.files);
            await connection.rollback();
            return res.status(400).json({ message: 'Selected package is not available.' });
        }

        const packageItem = packageRows[0];
        const bookingDate = `${req.body.shoot_date} ${req.body.time_slot}:00`;

        const [bookingResult] = await connection.execute(
            `INSERT INTO bookings (
                showroom_id,
                package_id,
                customer_name,
                customer_mobile,
                vehicle_brand,
                vehicle_model,
                vehicle_type,
                vehicle_color,
                registration_number,
                booking_date,
                time_slot,
                notes
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                showroom.id,
                packageItem.id,
                normalizeText(req.body.customer_name),
                normalizeText(req.body.customer_mobile),
                normalizeText(req.body.vehicle_brand),
                normalizeText(req.body.vehicle_model),
                normalizeText(req.body.vehicle_type),
                normalizeText(req.body.vehicle_color),
                normalizeText(req.body.registration_number).toUpperCase(),
                bookingDate,
                normalizeText(req.body.time_slot),
                normalizeText(req.body.notes) || null
            ]
        );

        const bookingId = bookingResult.insertId;
        const imageRows = req.files.map(file => [
            bookingId,
            `/uploads/bookings/${path.basename(file.filename)}`,
            req.user.id
        ]);

        await connection.query(
            `INSERT INTO booking_images (booking_id, image_url, uploaded_by) VALUES ?`,
            [imageRows]
        );

        await connection.commit();

        res.status(201).json({
            message: 'Booking created successfully.',
            booking: {
                id: bookingId,
                customer_name: normalizeText(req.body.customer_name),
                customer_mobile: normalizeText(req.body.customer_mobile),
                vehicle: {
                    brand: normalizeText(req.body.vehicle_brand),
                    model: normalizeText(req.body.vehicle_model),
                    type: normalizeText(req.body.vehicle_type),
                    color: normalizeText(req.body.vehicle_color),
                    registration_number: normalizeText(req.body.registration_number).toUpperCase()
                },
                package: {
                    id: packageItem.id,
                    name: packageItem.name,
                    price: Number(packageItem.price),
                    duration_minutes: packageItem.duration_minutes
                },
                booking_date: bookingDate,
                time_slot: normalizeText(req.body.time_slot),
                status: 'pending',
                photos: imageRows.map(row => row[1])
            }
        });
    } catch (error) {
        await connection.rollback();
        removeUploadedFiles(req.files);
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    } finally {
        connection.release();
    }
};
