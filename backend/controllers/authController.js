import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Showroom from '../models/Showroom.js';
import crypto from 'crypto';

// Active SSE connections: userId -> Array of client objects
const sseClients = new Map();

// Helper to notify a user's other sessions to logout
export const notifyUserLogout = (userId) => {
    const clients = sseClients.get(userId);
    console.log(`[SSE] notifyUserLogout called for user ${userId}. Found ${clients ? clients.length : 0} clients.`);
    if (clients) {
        clients.forEach((client, idx) => {
            try {
                console.log(`[SSE] Sending logout event to client index ${idx} for user ${userId}`);
                client.res.write(`event: logout\ndata: ${JSON.stringify({ message: 'Session invalidated, logged in from another device' })}\n\n`);
                client.res.end();
            } catch (err) {
                console.error(`[SSE] Error sending SSE logout event to client ${idx}:`, err);
            }
        });
        sseClients.delete(userId);
    }
};

const isProduction = process.env.NODE_ENV === 'production';
const getCookieOptions = () => ({
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
});

const generateTokens = (id, tokenVersion) => {
    const accessToken = jwt.sign({ id, tokenVersion }, process.env.JWT_SECRET, {
        expiresIn: '15m',
    });
    const refreshToken = jwt.sign({ id, tokenVersion }, process.env.JWT_REFRESH_SECRET, {
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

        const { accessToken, refreshToken } = generateTokens(user._id, user.tokenVersion);

        res.cookie('jwt', refreshToken, getCookieOptions());

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
            user.tokenVersion = (user.tokenVersion || 0) + 1;
            await user.save();
            
            // Notify existing SSE connections to log out instantly
            notifyUserLogout(user._id.toString());

            const { accessToken, refreshToken } = generateTokens(user._id, user.tokenVersion);

            res.cookie('jwt', refreshToken, getCookieOptions());

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

        if (decoded.tokenVersion !== user.tokenVersion) {
            return res.status(401).json({ message: 'Session invalidated, logged in from another device' });
        }

        const accessToken = jwt.sign({ id: user._id, tokenVersion: user.tokenVersion }, process.env.JWT_SECRET, {
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
        ...getCookieOptions(),
        expires: new Date(0),
        maxAge: 0,
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

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const resetUrl = `${frontendUrl.replace(/\/$/, '')}/reset-password/${resetToken}`;

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

// @desc    Establish real-time session stream for instant logout notifications
// @route   GET /api/auth/session-stream
// @access  Private (token passed via query param)
export const sessionStream = async (req, res) => {
    const token = req.query.token;
    if (!token) {
        return res.status(400).json({ message: 'Token required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (!user || decoded.tokenVersion !== user.tokenVersion) {
            return res.status(401).json({ message: 'Invalid token version or user' });
        }

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');

        res.write('data: connected\n\n');

        const userId = user._id.toString();
        const clientObj = { res, tokenVersion: decoded.tokenVersion };

        console.log(`[SSE] New client connection. User ID: ${userId}, Token Version: ${decoded.tokenVersion}`);

        if (!sseClients.has(userId)) {
            sseClients.set(userId, []);
        }
        sseClients.get(userId).push(clientObj);

        const keepAlive = setInterval(() => {
            res.write(': keep-alive\n\n');
        }, 30000);

        req.on('close', () => {
            console.log(`[SSE] Client connection closed. User ID: ${userId}, Token Version: ${decoded.tokenVersion}`);
            clearInterval(keepAlive);
            const clients = sseClients.get(userId);
            if (clients) {
                const updatedClients = clients.filter(c => c.res !== res);
                if (updatedClients.length === 0) {
                    sseClients.delete(userId);
                } else {
                    sseClients.set(userId, updatedClients);
                }
            }
        });
    } catch (error) {
        console.error('SSE verification error:', error);
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};
