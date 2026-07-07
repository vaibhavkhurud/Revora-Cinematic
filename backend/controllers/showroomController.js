import db from '../config/db.js';

// @desc    Get all showrooms with owner info + filters
// @route   GET /api/showrooms
// @access  Super Admin
export const getAllShowrooms = async (req, res) => {
    try {
        const { status, search, page = 1, limit = 10 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let query = `
            SELECT s.id, s.name, s.address, s.contact_number, s.status, s.rejection_reason, s.created_at,
                   u.id as owner_id, u.name as owner_name, u.email as owner_email
            FROM showrooms s
            JOIN users u ON s.owner_id = u.id
            WHERE 1=1
        `;
        const params = [];

        if (status && status !== 'all') {
            query += ` AND s.status = ?`;
            params.push(status);
        }

        if (search) {
            query += ` AND (s.name LIKE ? OR u.name LIKE ? OR u.email LIKE ?)`;
            const like = `%${search}%`;
            params.push(like, like, like);
        }

        // Count total for pagination
        const countQuery = `SELECT COUNT(*) as total FROM (${query}) as t`;
        const [countResult] = await db.execute(countQuery, params);
        const total = countResult[0].total;

        query += ` ORDER BY s.created_at DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), offset);

        const [showrooms] = await db.execute(query, params);

        res.json({
            showrooms,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get single showroom
// @route   GET /api/showrooms/:id
// @access  Super Admin
export const getShowroomById = async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT s.*, u.name as owner_name, u.email as owner_email
             FROM showrooms s JOIN users u ON s.owner_id = u.id
             WHERE s.id = ?`,
            [req.params.id]
        );
        if (rows.length === 0) return res.status(404).json({ message: 'Showroom not found' });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Approve a showroom
// @route   PATCH /api/showrooms/:id/approve
// @access  Super Admin
export const approveShowroom = async (req, res) => {
    try {
        const [result] = await db.execute(
            `UPDATE showrooms SET status = 'approved', rejection_reason = NULL WHERE id = ?`,
            [req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Showroom not found' });

        // Create notification for the owner
        const [showroom] = await db.execute('SELECT owner_id, name FROM showrooms WHERE id = ?', [req.params.id]);
        await db.execute(
            `INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)`,
            [showroom[0].owner_id, 'Showroom Approved!', `Your showroom "${showroom[0].name}" has been approved. You can now create bookings.`]
        );

        res.json({ message: 'Showroom approved successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Reject a showroom
// @route   PATCH /api/showrooms/:id/reject
// @access  Super Admin
export const rejectShowroom = async (req, res) => {
    try {
        const { reason } = req.body;
        const [result] = await db.execute(
            `UPDATE showrooms SET status = 'rejected', rejection_reason = ? WHERE id = ?`,
            [reason || 'No reason provided.', req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Showroom not found' });

        // Create notification for the owner
        const [showroom] = await db.execute('SELECT owner_id, name FROM showrooms WHERE id = ?', [req.params.id]);
        await db.execute(
            `INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)`,
            [showroom[0].owner_id, 'Showroom Rejected', `Your showroom "${showroom[0].name}" was rejected. Reason: ${reason || 'No reason provided.'}`]
        );

        res.json({ message: 'Showroom rejected' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update showroom details
// @route   PUT /api/showrooms/:id
// @access  Super Admin
export const updateShowroom = async (req, res) => {
    try {
        const { name, address, contact_number } = req.body;
        const [result] = await db.execute(
            `UPDATE showrooms SET name = ?, address = ?, contact_number = ? WHERE id = ?`,
            [name, address, contact_number, req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Showroom not found' });
        res.json({ message: 'Showroom updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete a showroom
// @route   DELETE /api/showrooms/:id
// @access  Super Admin
export const deleteShowroom = async (req, res) => {
    try {
        const [result] = await db.execute('DELETE FROM showrooms WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Showroom not found' });
        res.json({ message: 'Showroom deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};
