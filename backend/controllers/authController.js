import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../config/db.js';
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
        const [existingUsers] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const [userResult] = await connection.execute(
                'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
                [name, email, hashedPassword, 'showroom_owner']
            );
            const userId = userResult.insertId;

            await connection.execute(
                'INSERT INTO showrooms (owner_id, name, contact_number, address) VALUES (?, ?, ?, ?)',
                [userId, showroomName, contactNumber, address]
            );

            await connection.commit();

            const { accessToken, refreshToken } = generateTokens(userId);

            res.cookie('jwt', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV !== 'development',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });

            res.status(201).json({
                _id: userId,
                name,
                email,
                role: 'showroom_owner',
                token: accessToken,
            });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
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
        const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            const { accessToken, refreshToken } = generateTokens(user.id);

            res.cookie('jwt', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV !== 'development',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });

            res.json({
                _id: user.id,
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
        const [users] = await db.execute('SELECT * FROM users WHERE id = ?', [decoded.id]);
        
        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid refresh token' });
        }

        const accessToken = jwt.sign({ id: users[0].id }, process.env.JWT_SECRET, {
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
        const [users] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate mock token
        const resetToken = crypto.randomBytes(20).toString('hex');
        
        // Hash token and set to database
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        
        // Set expiry (10 minutes)
        const expiryDate = new Date(Date.now() + 10 * 60 * 1000);
        
        await db.execute('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?', 
            [hashedToken, expiryDate, email]
        );

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

        const [users] = await db.execute(
            'SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > NOW()',
            [hashedToken]
        );

        if (users.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        const salt = await bcrypt.genSalt(10);
        const newPassword = await bcrypt.hash(req.body.password, salt);

        await db.execute(
            'UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
            [newPassword, users[0].id]
        );

        res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
