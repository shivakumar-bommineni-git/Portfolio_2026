const { pool } = require('../config/database');

const getAll = async (req, res) => {
  const { search } = req.query;
  let query = `SELECT * FROM notes WHERE user_id = $1`;
  const params = [req.user.userId];

  if (search) {
    params.push(`%${search}%`);
    query += ` AND (title ILIKE $${params.length} OR content ILIKE $${params.length})`;
  }

  query += ` ORDER BY created_at DESC`;
  const { rows } = await pool.query(query, params);
  res.json({ success: true, notes: rows });
};

const create = async (req, res) => {
  const { title, content, tags } = req.body;
  if (!title?.trim()) return res.status(400).json({ success: false, message: 'Title is required' });

  const { rows } = await pool.query(
    `INSERT INTO notes (user_id, title, content, tags) VALUES ($1,$2,$3,$4) RETURNING *`,
    [req.user.userId, title.trim(), content?.trim() || '', tags || []]
  );
  res.status(201).json({ success: true, note: rows[0] });
};

const update = async (req, res) => {
  const { id } = req.params;
  const { title, content, tags } = req.body;

  const { rows } = await pool.query(
    `UPDATE notes SET title=$1, content=$2, tags=$3, updated_at=NOW()
     WHERE id=$4 AND user_id=$5 RETURNING *`,
    [title?.trim(), content?.trim() || '', tags || [], id, req.user.userId]
  );

  if (!rows.length) return res.status(404).json({ success: false, message: 'Note not found' });
  res.json({ success: true, note: rows[0] });
};

const remove = async (req, res) => {
  const { id } = req.params;
  const { rowCount } = await pool.query(
    `DELETE FROM notes WHERE id=$1 AND user_id=$2`,
    [id, req.user.userId]
  );
  if (!rowCount) return res.status(404).json({ success: false, message: 'Note not found' });
  res.json({ success: true });
};

module.exports = { getAll, create, update, remove };
