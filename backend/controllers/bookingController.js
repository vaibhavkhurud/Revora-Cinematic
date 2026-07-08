import fs from 'fs';
import path from 'path';
import Booking from '../models/Booking.js';
import BookingImage from '../models/BookingImage.js';
import Package from '../models/Package.js';
import Showroom from '../models/Showroom.js';

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

// @desc    Get active packages for booking form
// @route   GET /api/bookings/packages
// @access  Showroom Owner
export const getBookingPackages = async (req, res) => {
    try {
        const packages = await Package.find({ is_active: true }).sort({ price: 1 });
        res.json({ packages });
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

    try {
        const showroom = await Showroom.findOne({ owner_id: req.user._id });
        if (!showroom) {
            removeUploadedFiles(req.files);
            return res.status(404).json({ message: 'Showroom profile not found.' });
        }

        if (showroom.status !== 'approved') {
            removeUploadedFiles(req.files);
            return res.status(403).json({ message: 'Your showroom must be approved before creating bookings.' });
        }

        const packageItem = await Package.findOne({ _id: req.body.package_id, is_active: true });
        if (!packageItem) {
            removeUploadedFiles(req.files);
            return res.status(400).json({ message: 'Selected package is not available.' });
        }

        const bookingDate = new Date(`${req.body.shoot_date}T${req.body.time_slot}:00`);

        const newBooking = new Booking({
            showroom_id: showroom._id,
            package_id: packageItem._id,
            customer_name: normalizeText(req.body.customer_name),
            customer_mobile: normalizeText(req.body.customer_mobile),
            vehicle_brand: normalizeText(req.body.vehicle_brand),
            vehicle_model: normalizeText(req.body.vehicle_model),
            vehicle_type: normalizeText(req.body.vehicle_type),
            vehicle_color: normalizeText(req.body.vehicle_color),
            registration_number: normalizeText(req.body.registration_number).toUpperCase(),
            booking_date: bookingDate,
            time_slot: normalizeText(req.body.time_slot),
            notes: normalizeText(req.body.notes) || null
        });

        const savedBooking = await newBooking.save();

        const imagePromises = req.files.map(file => {
            const newImage = new BookingImage({
                booking_id: savedBooking._id,
                image_url: `/uploads/bookings/${path.basename(file.filename)}`,
                uploaded_by: req.user._id
            });
            return newImage.save();
        });

        const savedImages = await Promise.all(imagePromises);

        res.status(201).json({
            message: 'Booking created successfully.',
            booking: {
                id: savedBooking._id,
                customer_name: savedBooking.customer_name,
                customer_mobile: savedBooking.customer_mobile,
                vehicle: {
                    brand: savedBooking.vehicle_brand,
                    model: savedBooking.vehicle_model,
                    type: savedBooking.vehicle_type,
                    color: savedBooking.vehicle_color,
                    registration_number: savedBooking.registration_number
                },
                package: {
                    id: packageItem._id,
                    name: packageItem.name,
                    price: packageItem.price,
                    duration_minutes: packageItem.duration_minutes
                },
                booking_date: savedBooking.booking_date,
                time_slot: savedBooking.time_slot,
                status: savedBooking.status,
                photos: savedImages.map(img => img.image_url)
            }
        });
    } catch (error) {
        removeUploadedFiles(req.files);
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
