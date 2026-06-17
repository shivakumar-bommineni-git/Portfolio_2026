const { pool } = require('../config/database');

const get = async (req, res) => {
  const { rows } = await pool.query(
    `SELECT data, updated_at FROM resume_data WHERE user_id = $1`,
    [req.user.userId]
  );
  res.json({ success: true, data: rows[0]?.data || null, updatedAt: rows[0]?.updated_at || null });
};

const save = async (req, res) => {
  const { data } = req.body;
  if (!data || typeof data !== 'object') {
    return res.status(400).json({ success: false, message: 'Data must be an object' });
  }

  const { rows } = await pool.query(
    `INSERT INTO resume_data (user_id, data)
     VALUES ($1, $2)
     ON CONFLICT (user_id)
     DO UPDATE SET data = $2, updated_at = NOW()
     RETURNING updated_at`,
    [req.user.userId, JSON.stringify(data)]
  );
  res.json({ success: true, updatedAt: rows[0].updated_at });
};

module.exports = { get, save };
