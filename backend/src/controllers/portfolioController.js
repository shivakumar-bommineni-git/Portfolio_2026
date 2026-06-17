const { pool } = require('../config/database');

const getPublic = async (req, res) => {
  const { rows } = await pool.query(
    `SELECT config FROM portfolio_config ORDER BY updated_at DESC LIMIT 1`
  );
  res.json({ success: true, config: rows[0]?.config || null });
};

const get = async (req, res) => {
  const { rows } = await pool.query(
    `SELECT config, updated_at FROM portfolio_config WHERE user_id = $1`,
    [req.user.userId]
  );
  res.json({ success: true, config: rows[0]?.config || null, updatedAt: rows[0]?.updated_at || null });
};

const save = async (req, res) => {
  const { config } = req.body;
  if (!config || typeof config !== 'object') {
    return res.status(400).json({ success: false, message: 'Config must be an object' });
  }

  const { rows } = await pool.query(
    `INSERT INTO portfolio_config (user_id, config)
     VALUES ($1, $2)
     ON CONFLICT (user_id)
     DO UPDATE SET config = $2, updated_at = NOW()
     RETURNING updated_at`,
    [req.user.userId, JSON.stringify(config)]
  );
  res.json({ success: true, updatedAt: rows[0].updated_at });
};

module.exports = { getPublic, get, save };
