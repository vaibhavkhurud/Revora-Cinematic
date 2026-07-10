import bcrypt from 'bcrypt';
import crypto from 'crypto';
import User from '../models/User.js';
import Videographer from '../models/Videographer.js';

// @desc    Add a new videographer
// @route   POST /api/admin/videographers
// @access  Private/SuperAdmin
export const addVideographer = async (req, res) => {
    try {
        const { name, email, phone } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        // Auto-generate password (12 chars)
        const generatedPassword = crypto.randomBytes(6).toString('hex');
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(generatedPassword, salt);

        const user = new User({
            name,
            email,
            password: hashedPassword,
            role: 'videographer'
        });
        await user.save();

        const videographer = new Videographer({
            user_id: user._id,
            phone: phone || ''
        });
        await videographer.save();

        // Mocking an email sent to the videographer with their credentials
        console.log(`[MOCK EMAIL] To: ${email} | Subject: Your Revora Cinematic Account`);
        console.log(`[MOCK EMAIL] Hi ${name}, your account has been created. Login with email: ${email} and password: ${generatedPassword}`);

        res.status(201).json({
            message: 'Videographer added successfully',
            videographer: {
                name: user.name,
                email: user.email,
                phone: videographer.phone,
                generatedPassword
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all videographers
// @route   GET /api/admin/videographers
// @access  Private/SuperAdmin
export const getVideographers = async (req, res) => {
    try {
        const videographers = await Videographer.find()
            .populate('user_id', 'name email created_at')
            .sort({ created_at: -1 });

        res.json({
            videographers: videographers.map(v => ({
                id: v._id,
                name: v.user_id.name,
                email: v.user_id.email,
                phone: v.phone,
                status: v.status,
                joined: v.user_id.created_at
            }))
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
