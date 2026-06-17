const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Access denied: insufficient permissions' });
  }
  next();
};

const auditLog = async (req, action, targetId = null, targetType = null, details = null) => {
  try {
    const { query } = require('../config/database');
    await query(
      `INSERT INTO audit_logs (actor_id, actor_role, action, target_id, target_type, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        req.user?.userId || null,
        req.user?.role || null,
        action,
        targetId,
        targetType,
        details ? JSON.stringify(details) : null,
        req.ip,
      ]
    );
  } catch (err) {
    console.error('audit log error:', err.message);
  }
};

module.exports = { requireRole, auditLog };
