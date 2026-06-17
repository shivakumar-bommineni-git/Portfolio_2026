const { query } = require('../config/database');
const { auditLog } = require('../middleware/roles');

const getDashboardStats = async (req, res) => {
  try {
    const [total, active, newThisWeek] = await Promise.all([
      query("SELECT COUNT(*) FROM users WHERE role = 'user'"),
      query("SELECT COUNT(*) FROM users WHERE role = 'user' AND is_active = TRUE"),
      query(`SELECT COUNT(*) FROM users WHERE role = 'user' AND created_at > NOW() - INTERVAL '7 days'`),
    ]);
    res.json({
      success: true,
      stats: {
        totalUsers: parseInt(total.rows[0].count),
        activeUsers: parseInt(active.rows[0].count),
        newUsersThisWeek: parseInt(newThisWeek.rows[0].count),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load stats' });
  }
};

const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    const countRes = await query(
      `SELECT COUNT(*) FROM users WHERE role = 'user' ${search ? "AND (phone ILIKE $1 OR full_name ILIKE $1 OR email ILIKE $1)" : ''}`,
      search ? [`%${search}%`] : []
    );

    const usersRes = await query(
      `SELECT id, phone, full_name, email, is_active, is_phone_verified, created_at
       FROM users WHERE role = 'user' ${search ? "AND (phone ILIKE $1 OR full_name ILIKE $1 OR email ILIKE $1)" : ''}
       ORDER BY created_at DESC LIMIT ${search ? '$2' : '$1'} OFFSET ${search ? '$3' : '$2'}`,
      search ? [`%${search}%`, limit, offset] : [limit, offset]
    );

    res.json({
      success: true,
      users: usersRes.rows.map((u) => ({
        id: u.id, phone: u.phone, fullName: u.full_name, email: u.email,
        isActive: u.is_active, isPhoneVerified: u.is_phone_verified, createdAt: u.created_at,
      })),
      total: parseInt(countRes.rows[0].count),
      page,
      totalPages: Math.ceil(parseInt(countRes.rows[0].count) / limit),
    });
  } catch (err) {
    console.error('admin getUsers:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

const toggleUser = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      `UPDATE users SET is_active = NOT is_active, updated_at = NOW()
       WHERE id = $1 AND role = 'user' RETURNING id, is_active`,
      [id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'User not found' });
    await auditLog(req, result.rows[0].is_active ? 'ACTIVATE_USER' : 'DEACTIVATE_USER', id, 'user');
    res.json({ success: true, isActive: result.rows[0].is_active });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update user' });
  }
};

module.exports = { getDashboardStats, getUsers, toggleUser };
