import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes.js';
import showroomRoutes from './routes/showroomRoutes.js';
import packageRoutes from './routes/packageRoutes.js';
import showroomOwnerRoutes from './routes/showroomOwnerRoutes.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors({
    origin: 'http://localhost:5173', // Frontend URL
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/showrooms', showroomRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/showroom-owner', showroomOwnerRoutes);

app.get('/', (req, res) => {
    res.send('Revora Cinematic API is running...');
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
