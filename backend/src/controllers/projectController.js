const { pool } = require('../config/database');

exports.getAll = async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM projects WHERE user_id=$1 ORDER BY updated_at DESC',
    [req.user.id]
  );
  res.json({ projects: rows });
};

exports.create = async (req, res) => {
  const { name, client, description, status, start_date, end_date, rate, rate_type, payment_status, total_amount, tech_stack, invoice_data } = req.body;
  if (!name) return res.status(400).json({ message: 'Project name is required' });
  const { rows } = await pool.query(
    `INSERT INTO projects (user_id,name,client,description,status,start_date,end_date,rate,rate_type,payment_status,total_amount,tech_stack,invoice_data)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
    [req.user.id, name, client||'', description||'', status||'active', start_date||null, end_date||null,
     rate||0, rate_type||'fixed', payment_status||'pending', total_amount||0, tech_stack||[], invoice_data||{}]
  );
  res.status(201).json({ project: rows[0] });
};

exports.update = async (req, res) => {
  const { name, client, description, status, start_date, end_date, rate, rate_type, payment_status, total_amount, tech_stack, invoice_data } = req.body;
  const { rows } = await pool.query(
    `UPDATE projects SET name=$1,client=$2,description=$3,status=$4,start_date=$5,end_date=$6,
     rate=$7,rate_type=$8,payment_status=$9,total_amount=$10,tech_stack=$11,invoice_data=$12,updated_at=NOW()
     WHERE id=$13 AND user_id=$14 RETURNING *`,
    [name, client||'', description||'', status||'active', start_date||null, end_date||null,
     rate||0, rate_type||'fixed', payment_status||'pending', total_amount||0, tech_stack||[], invoice_data||{},
     req.params.id, req.user.id]
  );
  if (!rows[0]) return res.status(404).json({ message: 'Not found' });
  res.json({ project: rows[0] });
};

exports.remove = async (req, res) => {
  await pool.query('DELETE FROM projects WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
  res.json({ success: true });
};
