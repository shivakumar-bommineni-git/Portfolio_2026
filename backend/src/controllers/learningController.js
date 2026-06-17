const { pool } = require('../config/database');

exports.getAll = async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM learning_resources WHERE user_id=$1 ORDER BY updated_at DESC',
    [req.user.id]
  );
  res.json({ resources: rows });
};

exports.create = async (req, res) => {
  const { name, type, url, total_units, completed_units, status, notes, tags } = req.body;
  if (!name) return res.status(400).json({ message: 'Name is required' });
  const { rows } = await pool.query(
    `INSERT INTO learning_resources (user_id,name,type,url,total_units,completed_units,status,notes,tags)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [req.user.id, name, type||'course', url||'', total_units||0, completed_units||0, status||'active', notes||'', tags||[]]
  );
  res.status(201).json({ resource: rows[0] });
};

exports.update = async (req, res) => {
  const { name, type, url, total_units, completed_units, status, notes, tags } = req.body;
  const { rows } = await pool.query(
    `UPDATE learning_resources SET name=$1,type=$2,url=$3,total_units=$4,completed_units=$5,
     status=$6,notes=$7,tags=$8,updated_at=NOW()
     WHERE id=$9 AND user_id=$10 RETURNING *`,
    [name, type, url||'', total_units||0, completed_units||0, status||'active', notes||'', tags||[], req.params.id, req.user.id]
  );
  if (!rows[0]) return res.status(404).json({ message: 'Not found' });
  res.json({ resource: rows[0] });
};

exports.remove = async (req, res) => {
  await pool.query('DELETE FROM learning_resources WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
  res.json({ success: true });
};
