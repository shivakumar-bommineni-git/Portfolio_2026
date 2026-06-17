const { pool } = require('../config/database');

const getAll = async (req, res) => {
  const { category, difficulty } = req.query;
  let query = `SELECT * FROM interview_questions WHERE user_id = $1`;
  const params = [req.user.userId];

  if (category) { params.push(category); query += ` AND category = $${params.length}`; }
  if (difficulty) { params.push(difficulty); query += ` AND difficulty = $${params.length}`; }

  query += ` ORDER BY created_at DESC`;
  const { rows } = await pool.query(query, params);
  res.json({ success: true, questions: rows });
};

const create = async (req, res) => {
  const { question, answer, category, difficulty } = req.body;
  if (!question?.trim()) return res.status(400).json({ success: false, message: 'Question is required' });

  const { rows } = await pool.query(
    `INSERT INTO interview_questions (user_id, question, answer, category, difficulty)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [req.user.userId, question.trim(), answer?.trim() || '', category || 'General', difficulty || 'medium']
  );
  res.status(201).json({ success: true, question: rows[0] });
};

const update = async (req, res) => {
  const { id } = req.params;
  const { question, answer, category, difficulty, is_mastered } = req.body;

  const current = await pool.query(
    `SELECT * FROM interview_questions WHERE id=$1 AND user_id=$2`,
    [id, req.user.userId]
  );
  if (!current.rows.length) return res.status(404).json({ success: false, message: 'Question not found' });

  const c = current.rows[0];
  const { rows } = await pool.query(
    `UPDATE interview_questions
     SET question=$1, answer=$2, category=$3, difficulty=$4, is_mastered=$5, updated_at=NOW()
     WHERE id=$6 AND user_id=$7 RETURNING *`,
    [
      question?.trim() ?? c.question,
      answer?.trim() ?? c.answer,
      category ?? c.category,
      difficulty ?? c.difficulty,
      is_mastered !== undefined ? is_mastered : c.is_mastered,
      id,
      req.user.userId,
    ]
  );
  res.json({ success: true, question: rows[0] });
};

const remove = async (req, res) => {
  const { id } = req.params;
  const { rowCount } = await pool.query(
    `DELETE FROM interview_questions WHERE id=$1 AND user_id=$2`,
    [id, req.user.userId]
  );
  if (!rowCount) return res.status(404).json({ success: false, message: 'Question not found' });
  res.json({ success: true });
};

module.exports = { getAll, create, update, remove };
