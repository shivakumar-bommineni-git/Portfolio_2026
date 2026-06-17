const { pool } = require('../config/database');

exports.getAll = async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM todos WHERE user_id=$1 ORDER BY CASE status WHEN \'in_progress\' THEN 1 WHEN \'todo\' THEN 2 ELSE 3 END, priority DESC, created_at DESC',
    [req.user.id]
  );
  res.json({ todos: rows });
};

exports.create = async (req, res) => {
  const { title, description, priority, status, due_date, tags } = req.body;
  if (!title) return res.status(400).json({ message: 'Title is required' });
  const { rows } = await pool.query(
    `INSERT INTO todos (user_id,title,description,priority,status,due_date,tags)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [req.user.id, title, description||'', priority||'medium', status||'todo', due_date||null, tags||[]]
  );
  res.status(201).json({ todo: rows[0] });
};

exports.update = async (req, res) => {
  const { title, description, priority, status, due_date, tags } = req.body;
  const { rows } = await pool.query(
    `UPDATE todos SET title=$1,description=$2,priority=$3,status=$4,due_date=$5,tags=$6,updated_at=NOW()
     WHERE id=$7 AND user_id=$8 RETURNING *`,
    [title, description||'', priority||'medium', status||'todo', due_date||null, tags||[], req.params.id, req.user.id]
  );
  if (!rows[0]) return res.status(404).json({ message: 'Not found' });
  res.json({ todo: rows[0] });
};

exports.remove = async (req, res) => {
  await pool.query('DELETE FROM todos WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
  res.json({ success: true });
};
