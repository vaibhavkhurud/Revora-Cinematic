import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import BookingImage from '../models/BookingImage.js';
import Package from '../models/Package.js';
import Showroom from '../models/Showroom.js';
import Videographer from '../models/Videographer.js';

const MAX_LIMIT = 50;
const validStatuses = ['pending', 'assigned', 'arrived', 'shooting', 'editing', 'completed', 'cancelled'];
const sortableFields = {
    created_at: 'created_at',
    booking_date: 'booking_date',
    customer: 'customer_name',
    status: 'status'
};

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
const isObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getOwnerShowroom = async (userId) => Showroom.findOne({ owner_id: userId });

const serializePackage = (packageItem) => {
    if (!packageItem) return null;

    return {
        id: packageItem._id.toString(),
        name: packageItem.name,
        description: packageItem.description || '',
        price: Number(packageItem.price || 0),
        duration_minutes: Number(packageItem.duration_minutes || 0),
        features: Array.isArray(packageItem.features) ? packageItem.features : []
    };
};

const serializeShowroom = (showroom) => {
    if (!showroom) return null;

    return {
        id: showroom._id.toString(),
        name: showroom.name,
        address: showroom.address || '',
        contact_number: showroom.contact_number || ''
    };
};

const serializeVideographer = (videographer) => {
    if (!videographer) return null;

    return {
        id: videographer._id.toString(),
        name: videographer.user_id?.name || 'Unnamed videographer',
        email: videographer.user_id?.email || '',
        phone: videographer.phone || '',
        status: videographer.status
    };
};

const serializeBooking = (booking, images = []) => {
    const id = booking._id.toString();

    return {
        id,
        booking_id: `BK-${id.slice(-6).toUpperCase()}`,
        customer_name: booking.customer_name,
        customer_mobile: booking.customer_mobile,
        vehicle_brand: booking.vehicle_brand,
        vehicle_model: booking.vehicle_model,
        vehicle_type: booking.vehicle_type,
        vehicle_color: booking.vehicle_color,
        registration_number: booking.registration_number,
        vehicle: {
            brand: booking.vehicle_brand,
            model: booking.vehicle_model,
            type: booking.vehicle_type,
            color: booking.vehicle_color,
            registration_number: booking.registration_number
        },
        package: serializePackage(booking.package_id),
        showroom: serializeShowroom(booking.showroom_id),
        assigned_videographer: serializeVideographer(booking.videographer_id),
        booking_date: booking.booking_date,
        time_slot: booking.time_slot,
        status: booking.status,
        notes: booking.notes || '',
        photos: images.map(image => image.image_url),
        created_at: booking.created_at,
        updated_at: booking.updated_at
    };
};

const populateBookingQuery = (query) => query
    .populate('package_id', 'name description price duration_minutes features')
    .populate('showroom_id', 'name address contact_number')
    .populate({
        path: 'videographer_id',
        select: 'phone status user_id',
        populate: { path: 'user_id', select: 'name email' }
    });

const buildBookingSearchQuery = ({ search, status, showroomId }) => {
    const query = {};

    if (showroomId) query.showroom_id = showroomId;
    if (status && status !== 'all') query.status = status;

    if (search && normalizeText(search)) {
        const safeSearch = escapeRegex(normalizeText(search));
        query.$or = [
            { customer_name: { $regex: safeSearch, $options: 'i' } },
            { customer_mobile: { $regex: safeSearch, $options: 'i' } },
            { vehicle_brand: { $regex: safeSearch, $options: 'i' } },
            { vehicle_model: { $regex: safeSearch, $options: 'i' } },
            { registration_number: { $regex: safeSearch, $options: 'i' } }
        ];
    }

    return query;
};

const validateBookingUpdatePayload = (body) => {
    const allowedTextFields = {
        customer_name: 120,
        customer_mobile: 20,
        vehicle_brand: 80,
        vehicle_model: 80,
        vehicle_type: 60,
        vehicle_color: 60,
        registration_number: 30,
        notes: 1000,
        time_slot: 30
    };

    for (const [field, maxLength] of Object.entries(allowedTextFields)) {
        if (body[field] !== undefined && normalizeText(body[field]).length > maxLength) {
            return `${field.replace(/_/g, ' ')} cannot exceed ${maxLength} characters.`;
        }
    }

    if (body.customer_mobile !== undefined && !/^[0-9+\-\s()]{7,20}$/.test(normalizeText(body.customer_mobile))) {
        return 'Customer mobile number is invalid.';
    }

    if (body.registration_number !== undefined && !/^[a-z0-9 -]{4,30}$/i.test(normalizeText(body.registration_number))) {
        return 'Registration number is invalid.';
    }

    if (body.status !== undefined && !validStatuses.includes(body.status)) {
        return 'Invalid booking status.';
    }

    if (body.package_id !== undefined && !isObjectId(body.package_id)) {
        return 'Selected package is invalid.';
    }

    if (body.booking_date !== undefined && Number.isNaN(new Date(body.booking_date).getTime())) {
        return 'Booking date is invalid.';
    }

    return null;
};

const validateBookingPayload = (body, files = []) => {
    for (const field of requiredFields) {
        if (!normalizeText(body[field])) {
            return `${field.replace(/_/g, ' ')} is required.`;
        }
    }

    if (!isObjectId(body.package_id)) {
        return 'Selected package is invalid.';
    }

    const maxLengths = {
        customer_name: 120,
        customer_mobile: 20,
        vehicle_brand: 80,
        vehicle_model: 80,
        vehicle_type: 60,
        vehicle_color: 60,
        registration_number: 30,
        notes: 1000
    };

    for (const [field, maxLength] of Object.entries(maxLengths)) {
        if (normalizeText(body[field]).length > maxLength) {
            return `${field.replace(/_/g, ' ')} cannot exceed ${maxLength} characters.`;
        }
    }

    const mobile = normalizeText(body.customer_mobile);
    if (!/^[0-9+\-\s()]{7,20}$/.test(mobile)) {
        return 'Customer mobile number is invalid.';
    }

    if (!/^[a-z0-9 -]{4,30}$/i.test(normalizeText(body.registration_number))) {
        return 'Registration number is invalid.';
    }

    const shootDate = new Date(`${body.shoot_date}T${body.time_slot}:00`);
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
        res.json({ packages: packages.map(serializePackage) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    List showroom bookings
// @route   GET /api/bookings
// @access  Showroom Owner
export const getBookings = async (req, res) => {
    try {
        const showroom = await getOwnerShowroom(req.user._id);
        if (!showroom) return res.status(404).json({ message: 'Showroom profile not found.' });

        const {
            search,
            status = 'all',
            sortBy = 'created_at',
            sortOrder = 'desc',
            page = 1,
            limit = 10
        } = req.query;

        if (status !== 'all' && !validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid booking status filter.' });
        }

        const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
        const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), MAX_LIMIT);
        const query = buildBookingSearchQuery({ search, status, showroomId: showroom._id });

        const sortField = sortableFields[sortBy] || sortableFields.created_at;
        const sortDirection = sortOrder === 'asc' ? 1 : -1;
        const total = await Booking.countDocuments(query);
        const bookings = await populateBookingQuery(Booking.find(query))
            .sort({ [sortField]: sortDirection, created_at: -1 })
            .skip((parsedPage - 1) * parsedLimit)
            .limit(parsedLimit);

        res.json({
            bookings: bookings.map(booking => serializeBooking(booking)),
            statuses: validStatuses,
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

// @desc    Get a single showroom booking
// @route   GET /api/bookings/:id
// @access  Showroom Owner
export const getBookingById = async (req, res) => {
    try {
        if (!isObjectId(req.params.id)) {
            return res.status(400).json({ message: 'Invalid booking id.' });
        }

        const showroom = await getOwnerShowroom(req.user._id);
        if (!showroom) return res.status(404).json({ message: 'Showroom profile not found.' });

        const booking = await populateBookingQuery(Booking.findOne({ _id: req.params.id, showroom_id: showroom._id }));
        if (!booking) return res.status(404).json({ message: 'Booking not found.' });

        const images = await BookingImage.find({ booking_id: booking._id }).sort({ uploaded_at: 1 });
        res.json({ booking: serializeBooking(booking, images) });
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
        const showroom = await getOwnerShowroom(req.user._id);
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

        const savedImages = await Promise.all(req.files.map(file => {
            const newImage = new BookingImage({
                booking_id: savedBooking._id,
                image_url: `/uploads/bookings/${path.basename(file.filename)}`,
                uploaded_by: req.user._id
            });
            return newImage.save();
        }));

        await savedBooking.populate('package_id', 'name description price duration_minutes features');
        await savedBooking.populate('showroom_id', 'name address contact_number');

        res.status(201).json({
            message: 'Booking created successfully.',
            booking: serializeBooking(savedBooking, savedImages)
        });
    } catch (error) {
        removeUploadedFiles(req.files);
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    List all bookings for admin management
// @route   GET /api/bookings/admin
// @access  Super Admin
export const getAdminBookings = async (req, res) => {
    try {
        const {
            search,
            status = 'all',
            sortBy = 'created_at',
            sortOrder = 'desc',
            page = 1,
            limit = 10
        } = req.query;

        if (status !== 'all' && !validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid booking status filter.' });
        }

        const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
        const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), MAX_LIMIT);
        const sortField = sortableFields[sortBy] || sortableFields.created_at;
        const sortDirection = sortOrder === 'asc' ? 1 : -1;
        const query = buildBookingSearchQuery({ search, status });

        const total = await Booking.countDocuments(query);
        const bookings = await populateBookingQuery(Booking.find(query))
            .sort({ [sortField]: sortDirection, created_at: -1 })
            .skip((parsedPage - 1) * parsedLimit)
            .limit(parsedLimit);

        res.json({
            bookings: bookings.map(booking => serializeBooking(booking)),
            statuses: validStatuses,
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

// @desc    Get single booking for admin management
// @route   GET /api/bookings/admin/:id
// @access  Super Admin
export const getAdminBookingById = async (req, res) => {
    try {
        if (!isObjectId(req.params.id)) {
            return res.status(400).json({ message: 'Invalid booking id.' });
        }

        const booking = await populateBookingQuery(Booking.findById(req.params.id));
        if (!booking) return res.status(404).json({ message: 'Booking not found.' });

        const images = await BookingImage.find({ booking_id: booking._id }).sort({ uploaded_at: 1 });
        res.json({ booking: serializeBooking(booking, images) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update booking fields
// @route   PUT /api/bookings/admin/:id
// @access  Super Admin
export const updateAdminBooking = async (req, res) => {
    try {
        if (!isObjectId(req.params.id)) {
            return res.status(400).json({ message: 'Invalid booking id.' });
        }

        const validationError = validateBookingUpdatePayload(req.body);
        if (validationError) return res.status(400).json({ message: validationError });

        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found.' });

        const editableFields = [
            'customer_name',
            'customer_mobile',
            'vehicle_brand',
            'vehicle_model',
            'vehicle_type',
            'vehicle_color',
            'registration_number',
            'time_slot',
            'notes',
            'status'
        ];

        editableFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                booking[field] = field === 'registration_number'
                    ? normalizeText(req.body[field]).toUpperCase()
                    : normalizeText(req.body[field]);
            }
        });

        if (req.body.booking_date !== undefined) {
            booking.booking_date = new Date(req.body.booking_date);
        }

        if (req.body.package_id !== undefined) {
            const packageItem = await Package.findById(req.body.package_id);
            if (!packageItem) return res.status(400).json({ message: 'Selected package was not found.' });
            booking.package_id = packageItem._id;
        }

        await booking.save();
        const populated = await populateBookingQuery(Booking.findById(booking._id));

        res.json({ message: 'Booking updated successfully.', booking: serializeBooking(populated) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete booking
// @route   DELETE /api/bookings/admin/:id
// @access  Super Admin
export const deleteAdminBooking = async (req, res) => {
    try {
        if (!isObjectId(req.params.id)) {
            return res.status(400).json({ message: 'Invalid booking id.' });
        }

        const booking = await Booking.findByIdAndDelete(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found.' });

        const images = await BookingImage.find({ booking_id: booking._id });
        images.forEach((image) => {
            const filePath = path.join(process.cwd(), image.image_url.replace(/^\//, ''));
            fs.unlink(filePath, () => {});
        });
        await BookingImage.deleteMany({ booking_id: booking._id });

        res.json({ message: 'Booking deleted successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get videographers available for assignment
// @route   GET /api/bookings/admin/videographers
// @access  Super Admin
export const getAssignableVideographers = async (req, res) => {
    try {
        const videographers = await Videographer.find({ status: { $ne: 'on_leave' } })
            .populate('user_id', 'name email')
            .sort({ status: 1, created_at: -1 });

        res.json({ videographers: videographers.map(serializeVideographer) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Assign videographer to booking
// @route   PATCH /api/bookings/admin/:id/assign
// @access  Super Admin
export const assignVideographer = async (req, res) => {
    try {
        const { videographer_id } = req.body;

        if (!isObjectId(req.params.id)) {
            return res.status(400).json({ message: 'Invalid booking id.' });
        }

        if (!isObjectId(videographer_id)) {
            return res.status(400).json({ message: 'Select a valid videographer.' });
        }

        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found.' });

        const videographer = await Videographer.findById(videographer_id);
        if (!videographer || videographer.status === 'on_leave') {
            return res.status(400).json({ message: 'Selected videographer is not available for assignment.' });
        }

        booking.videographer_id = videographer._id;
        if (booking.status === 'pending') {
            booking.status = 'assigned';
        }
        await booking.save();

        videographer.status = 'assigned';
        await videographer.save();

        const populated = await populateBookingQuery(Booking.findById(booking._id));
        res.json({ message: 'Videographer assigned successfully.', booking: serializeBooking(populated) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update booking status
// @route   PATCH /api/bookings/admin/:id/status
// @access  Super Admin
export const updateBookingStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!isObjectId(req.params.id)) {
            return res.status(400).json({ message: 'Invalid booking id.' });
        }

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid booking status.' });
        }

        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found.' });

        if (['arrived', 'shooting', 'editing', 'completed'].includes(status) && !booking.videographer_id) {
            return res.status(400).json({ message: 'Assign a videographer before moving this booking forward.' });
        }

        booking.status = status;
        await booking.save();

        if (booking.videographer_id && status === 'completed') {
            await Videographer.findByIdAndUpdate(booking.videographer_id, { status: 'available' });
        }

        const populated = await populateBookingQuery(Booking.findById(booking._id));
        res.json({ message: 'Booking status updated successfully.', booking: serializeBooking(populated) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
