import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import authRoutes from './routes/authRoutes.js';
import showroomRoutes from './routes/showroomRoutes.js';
import packageRoutes from './routes/packageRoutes.js';
import showroomOwnerRoutes from './routes/showroomOwnerRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import videographerRoutes from './routes/videographerRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import connectDB from './config/db.js';

dotenv.config();

const app = express();
connectDB();

const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:3000',
    'https://revora-cinematic.vercel.app',
    'https://www.revoracinematic.com',
    'https://revoracinematic.com'
].filter(Boolean);

const corsOptions = {
    origin: (origin, callback) => {
        // Allow any localhost origin in development
        if (!origin || allowedOrigins.includes(origin) || /^http:\/\/localhost:\d+$/.test(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
};

app.use(cors(corsOptions));

// Handle preflight OPTIONS requests without registering a wildcard route
app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
        return cors(corsOptions)(req, res, next);
    }
    next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/showrooms', showroomRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/showroom-owner', showroomOwnerRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/videographer', videographerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/', (req, res) => {
    res.send('Revora Cinematic API is running...');
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
