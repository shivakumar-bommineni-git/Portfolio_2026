const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { query } = require('../config/database');
const { auditLog } = require('../middleware/roles');

const getDashboardStats = async (req, res) => {
  try {
    const [totalUsers, totalAdmins, activeUsers, recentUsers] = await Promise.all([
      query("SELECT COUNT(*) FROM users WHERE role = 'user'"),
      query("SELECT COUNT(*) FROM users WHERE role = 'admin'"),
      query("SELECT COUNT(*) FROM users WHERE role = 'user' AND is_active = TRUE"),
      query(`SELECT COUNT(*) FROM users WHERE role = 'user' AND created_at > NOW() - INTERVAL '7 days'`),
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers: parseInt(totalUsers.rows[0].count),
        totalAdmins: parseInt(totalAdmins.rows[0].count),
        activeUsers: parseInt(activeUsers.rows[0].count),
        newUsersThisWeek: parseInt(recentUsers.rows[0].count),
      },
    });
  } catch (err) {
    console.error('getDashboardStats:', err);
    res.status(500).json({ success: false, message: 'Failed to load stats' });
  }
};

const getAdmins = async (req, res) => {
  try {
    const result = await query(
      `SELECT id, phone, full_name, email, is_active, created_at
       FROM users WHERE role = 'admin' ORDER BY created_at DESC`
    );
    res.json({ success: true, admins: result.rows.map((a) => ({
      id: a.id, phone: a.phone, fullName: a.full_name,
      email: a.email, isActive: a.is_active, createdAt: a.created_at,
    })) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch admins' });
  }
};

const createAdmin = async (req, res) => {
  try {
    const { phone, fullName, email } = req.body;

    const existing = await query('SELECT id, role FROM users WHERE phone = $1', [phone]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Phone number already in use' });
    }

    const tempPassword = crypto.randomBytes(6).toString('hex') + 'A1!';
    const hash = await bcrypt.hash(tempPassword, 12);

    const result = await query(
      `INSERT INTO users (phone, password_hash, full_name, email, role, is_phone_verified)
       VALUES ($1, $2, $3, $4, 'admin', TRUE) RETURNING id, phone, full_name, email, created_at`,
      [phone, hash, fullName, email || null]
    );

    const admin = result.rows[0];
    await auditLog(req, 'CREATE_ADMIN', admin.id, 'user', { phone, fullName });

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      admin: { id: admin.id, phone: admin.phone, fullName: admin.full_name, email: admin.email },
      tempPassword,
    });
  } catch (err) {
    console.error('createAdmin:', err);
    if (err.code === '23505') return res.status(400).json({ success: false, message: 'Phone or email already exists' });
    res.status(500).json({ success: false, message: 'Failed to create admin' });
  }
};

const toggleAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      `UPDATE users SET is_active = NOT is_active, updated_at = NOW()
       WHERE id = $1 AND role = 'admin' RETURNING id, full_name, is_active`,
      [id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Admin not found' });
    const admin = result.rows[0];
    await auditLog(req, admin.is_active ? 'ACTIVATE_ADMIN' : 'DEACTIVATE_ADMIN', id, 'user');
    res.json({ success: true, message: `Admin ${admin.is_active ? 'activated' : 'deactivated'}`, isActive: admin.is_active });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update admin' });
  }
};

const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      "DELETE FROM users WHERE id = $1 AND role = 'admin' RETURNING id, full_name",
      [id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Admin not found' });
    await auditLog(req, 'DELETE_ADMIN', id, 'user', { name: result.rows[0].full_name });
    res.json({ success: true, message: 'Admin deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete admin' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    const searchClause = search
      ? `AND (phone ILIKE $3 OR full_name ILIKE $3 OR email ILIKE $3)`
      : '';
    const params = search
      ? ['user', limit, `%${search}%`, offset]
      : ['user', limit, offset];

    const countRes = await query(
      `SELECT COUNT(*) FROM users WHERE role = $1 ${search ? 'AND (phone ILIKE $2 OR full_name ILIKE $2 OR email ILIKE $2)' : ''}`,
      search ? ['user', `%${search}%`] : ['user']
    );

    const usersRes = await query(
      `SELECT id, phone, full_name, email, is_active, is_phone_verified, created_at
       FROM users WHERE role = $1 ${searchClause}
       ORDER BY created_at DESC LIMIT $2 OFFSET $${search ? 4 : 3}`,
      params
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
    console.error('getAllUsers:', err);
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

const getAuditLogs = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const result = await query(
      `SELECT al.*, u.full_name as actor_name, u.phone as actor_phone
       FROM audit_logs al
       LEFT JOIN users u ON al.actor_id = u.id
       ORDER BY al.created_at DESC LIMIT $1`,
      [limit]
    );
    res.json({ success: true, logs: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch audit logs' });
  }
};

module.exports = { getDashboardStats, getAdmins, createAdmin, toggleAdmin, deleteAdmin, getAllUsers, toggleUser, getAuditLogs };
