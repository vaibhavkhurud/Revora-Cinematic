import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Showroom from '../models/Showroom.js';
import crypto from 'crypto';

const generateTokens = (id) => {
    const accessToken = jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '15m',
    });
    const refreshToken = jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: '7d',
    });
    return { accessToken, refreshToken };
};

// @desc    Register a new showroom owner
// @route   POST /api/auth/register
// @access  Public
export const registerShowroom = async (req, res) => {
    const { name, email, password, showroomName, contactNumber, address } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = new User({
            name,
            email,
            password: hashedPassword,
            role: 'showroom_owner'
        });
        
        await user.save();

        const showroom = new Showroom({
            owner_id: user._id,
            name: showroomName,
            contact_number: contactNumber,
            address: address
        });
        
        await showroom.save();

        const { accessToken, refreshToken } = generateTokens(user._id);

        res.cookie('jwt', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV !== 'development',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.status(201).json({
            _id: user._id,
            name,
            email,
            role: 'showroom_owner',
            token: accessToken,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            const { accessToken, refreshToken } = generateTokens(user._id);

            res.cookie('jwt', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV !== 'development',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });

            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: accessToken,
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Public
export const refreshToken = async (req, res) => {
    const refreshToken = req.cookies?.jwt;

    if (!refreshToken) {
        return res.status(401).json({ message: 'No refresh token provided' });
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await User.findById(decoded.id);
        
        if (!user) {
            return res.status(401).json({ message: 'Invalid refresh token' });
        }

        const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: '15m',
        });

        res.json({ token: accessToken });
    } catch (error) {
        res.status(401).json({ message: 'Invalid or expired refresh token' });
    }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Public
export const logout = (req, res) => {
    res.cookie('jwt', '', {
        httpOnly: true,
        expires: new Date(0),
    });
    res.status(200).json({ message: 'Logged out successfully' });
};

// @desc    Forgot Password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate mock token
        const resetToken = crypto.randomBytes(20).toString('hex');
        
        // Hash token and set to database
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        
        // Set expiry (10 minutes)
        const expiryDate = new Date(Date.now() + 10 * 60 * 1000);
        
        user.reset_token = hashedToken;
        user.reset_token_expires = expiryDate;
        await user.save();

        // MOCK EMAIL SENDING
        // const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;
        const resetUrl = `https://revora-cinematic.vercel.app/reset-password/${resetToken}`;

        console.log(`[MOCK EMAIL] To: ${email} | Click here to reset: ${resetUrl}`);

        res.status(200).json({ message: 'Password reset link sent (Check server console)' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password/:token
// @access  Public
export const resetPassword = async (req, res) => {
    try {
        const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

        const user = await User.findOne({
            reset_token: hashedToken,
            reset_token_expires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        const salt = await bcrypt.genSalt(10);
        const newPassword = await bcrypt.hash(req.body.password, salt);

        user.password = newPassword;
        user.reset_token = undefined;
        user.reset_token_expires = undefined;
        await user.save();

        res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
