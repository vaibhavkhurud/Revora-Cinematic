import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes.js';
import showroomRoutes from './routes/showroomRoutes.js';
import packageRoutes from './routes/packageRoutes.js';
import showroomOwnerRoutes from './routes/showroomOwnerRoutes.js';
import connectDB from './config/db.js';

dotenv.config();

const app = express();
connectDB();

const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:5173',
    'http://localhost:3000'
].filter(Boolean);

// app.use(cors({
//     origin: (origin, callback) => {
//         if (!origin || allowedOrigins.includes(origin)) {
//             callback(null, true);
//         } else {
//             callback(new Error('Not allowed by CORS'));
//         }
//     },
//     credentials: true
// }));



app.use(cors({
  origin: 'https://revora-cinematic.vercel.app', // your Vercel domain, no trailing slash
  credentials: true
}));

app.options('*', cors()); // handle preflight explicitly

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
