const pool = require('./db');
const auth = (req) => req.headers['x-admin-token'] === (process.env.ADMIN_PASSWORD || 'domingo2024');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-admin-token');
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    if (req.method === 'GET' && !req.query.admin) {
      const today = new Date().toISOString().slice(0, 10);
      const result = await pool.query(
        `SELECT * FROM announcements WHERE status='active' AND start_date <= $1 AND end_date >= $1 ORDER BY created_at DESC`,
        [today]
      );
      return res.json(result.rows);
    }
    if (req.method === 'GET' && req.query.admin) {
      if (!auth(req)) return res.status(401).json({ error: 'Non autorisé' });
      const result = await pool.query('SELECT * FROM announcements ORDER BY created_at DESC');
      return res.json(result.rows);
    }
    if (req.method === 'POST') {
      if (!auth(req)) return res.status(401).json({ error: 'Non autorisé' });
      const { title, message, start_date, end_date, status } = req.body;
      const result = await pool.query(
        'INSERT INTO announcements (title,message,start_date,end_date,status) VALUES ($1,$2,$3,$4,$5) RETURNING id',
        [title, message, start_date, end_date, status || 'active']
      );
      return res.json({ id: result.rows[0].id });
    }
    if (req.method === 'PUT') {
      if (!auth(req)) return res.status(401).json({ error: 'Non autorisé' });
      const { id, title, message, start_date, end_date, status } = req.body;
      await pool.query(
        'UPDATE announcements SET title=$1,message=$2,start_date=$3,end_date=$4,status=$5 WHERE id=$6',
        [title, message, start_date, end_date, status, id]
      );
      return res.json({ success: true });
    }
    if (req.method === 'DELETE') {
      if (!auth(req)) return res.status(401).json({ error: 'Non autorisé' });
      await pool.query('DELETE FROM announcements WHERE id=$1', [req.query.id]);
      return res.json({ success: true });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
