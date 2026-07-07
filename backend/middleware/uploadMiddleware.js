import fs from 'fs';
import path from 'path';
import multer from 'multer';

const bookingUploadDir = path.join(process.cwd(), 'uploads', 'bookings');

fs.mkdirSync(bookingUploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, bookingUploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const safeBase = path
            .basename(file.originalname, ext)
            .replace(/[^a-z0-9]/gi, '-')
            .replace(/-+/g, '-')
            .slice(0, 40)
            .toLowerCase();

        cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeBase}${ext}`);
    }
});

const imageFileFilter = (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
        return cb(new Error('Only image files are allowed.'));
    }

    cb(null, true);
};

export const uploadVehiclePhotos = multer({
    storage,
    fileFilter: imageFileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 8
    }
});
