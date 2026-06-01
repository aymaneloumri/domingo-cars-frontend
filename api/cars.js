const pool = require('./db');
const auth = (req) => req.headers['x-admin-token'] === (process.env.ADMIN_PASSWORD || 'domingo2024');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-admin-token');
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    if (req.method === 'GET' && req.query.admin) {
      if (!auth(req)) return res.status(401).json({ error: 'Non autorisé' });
      const result = await pool.query('SELECT * FROM cars ORDER BY sort_order ASC, id ASC');
      return res.json(result.rows);
    }
    if (req.method === 'GET' && req.query.availability) {
      const { car_id, start, end } = req.query;
      const result = await pool.query(
        `SELECT * FROM reservations WHERE car_id=$1 AND status IN ('pending','confirmed') AND start_date < $2 AND end_date > $3`,
        [car_id, end, start]
      );
      return res.json({ available: result.rows.length === 0 });
    }
    if (req.method === 'GET') {
      const result = await pool.query("SELECT * FROM cars WHERE status='active' ORDER BY sort_order ASC, id ASC");
      return res.json(result.rows);
    }
    if (req.method === 'POST') {
      if (!auth(req)) return res.status(401).json({ error: 'Non autorisé' });
      const { name, category, price_per_day, image_url, description, matricule, status } = req.body;
      const result = await pool.query(
        'INSERT INTO cars (name,category,price_per_day,image_url,description,matricule,status) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id',
        [name, category, price_per_day, image_url || '', description || '', matricule || '', status || 'active']
      );
      return res.json({ id: result.rows[0].id });
    }
    if (req.method === 'PUT') {
      if (!auth(req)) return res.status(401).json({ error: 'Non autorisé' });
      const { id, name, category, price_per_day, image_url, description, matricule, status } = req.body;
      await pool.query(
        'UPDATE cars SET name=$1,category=$2,price_per_day=$3,image_url=$4,description=$5,matricule=$6,status=$7 WHERE id=$8',
        [name, category, price_per_day, image_url, description, matricule, status, id]
      );
      return res.json({ success: true });
    }
    if (req.method === 'DELETE') {
      if (!auth(req)) return res.status(401).json({ error: 'Non autorisé' });
      await pool.query('DELETE FROM cars WHERE id=$1', [req.query.id]);
      return res.json({ success: true });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
