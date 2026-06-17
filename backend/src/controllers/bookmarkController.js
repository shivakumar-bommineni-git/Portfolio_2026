const { pool } = require('../config/database');
const https = require('https');
const http  = require('http');
const { URL } = require('url');

/* Fetch page title + favicon from a URL (best-effort, 3s timeout) */
const fetchMeta = (rawUrl) => new Promise((resolve) => {
  try {
    const parsed = new URL(rawUrl);
    const favicon = `${parsed.protocol}//${parsed.hostname}/favicon.ico`;
    const lib = parsed.protocol === 'https:' ? https : http;
    const req = lib.get(rawUrl, { timeout: 3000, headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let html = '';
      res.setEncoding('utf8');
      res.on('data', (c) => { html += c; if (html.length > 8000) res.destroy(); });
      res.on('end', () => {
        const match = html.match(/<title[^>]*>([^<]{1,200})<\/title>/i);
        const title = match ? match[1].trim().replace(/\s+/g, ' ') : parsed.hostname;
        resolve({ title, favicon });
      });
    });
    req.on('error', () => resolve({ title: rawUrl, favicon: '' }));
    req.on('timeout', () => { req.destroy(); resolve({ title: rawUrl, favicon: '' }); });
  } catch {
    resolve({ title: rawUrl, favicon: '' });
  }
});

exports.getAll = async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM bookmarks WHERE user_id=$1 ORDER BY created_at DESC',
    [req.user.id]
  );
  res.json({ bookmarks: rows });
};

exports.create = async (req, res) => {
  const { url, title: manualTitle, description, tags } = req.body;
  if (!url) return res.status(400).json({ message: 'URL is required' });

  const { title: fetchedTitle, favicon } = await fetchMeta(url);
  const title = manualTitle?.trim() || fetchedTitle;

  const { rows } = await pool.query(
    `INSERT INTO bookmarks (user_id,url,title,description,favicon,tags)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [req.user.id, url, title, description||'', favicon, tags||[]]
  );
  res.status(201).json({ bookmark: rows[0] });
};

exports.update = async (req, res) => {
  const { title, description, tags } = req.body;
  const { rows } = await pool.query(
    `UPDATE bookmarks SET title=$1,description=$2,tags=$3 WHERE id=$4 AND user_id=$5 RETURNING *`,
    [title, description||'', tags||[], req.params.id, req.user.id]
  );
  if (!rows[0]) return res.status(404).json({ message: 'Not found' });
  res.json({ bookmark: rows[0] });
};

exports.remove = async (req, res) => {
  await pool.query('DELETE FROM bookmarks WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
  res.json({ success: true });
};
