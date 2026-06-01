const pool = require('./db');
const auth = (req) =>
  req.headers['x-admin-token'] === (process.env.ADMIN_PASSWORD || 'domingo2024');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-admin-token');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      if (!auth(req)) return res.status(401).json({ error: 'Non autorisé' });
      const result = await pool.query(
        `SELECT r.*, c.name as car_name FROM reservations r
         LEFT JOIN cars c ON r.car_id = c.id
         ORDER BY r.start_date DESC`
      );
      return res.json(result.rows);
    }
    if (req.method === 'POST') {
      if (!auth(req)) return res.status(401).json({ error: 'Non autorisé' });
      const { car_id, client_name, client_phone, start_date, end_date, status } = req.body;
      const conflict = await pool.query(
        `SELECT * FROM reservations
         WHERE car_id=$1 AND status IN ('pending','confirmed')
         AND start_date < $2 AND end_date > $3`,
        [car_id, end_date, start_date]
      );
      if (conflict.rows.length > 0) {
        return res.status(409).json({ conflict: true, error: 'Conflit de dates pour cette voiture' });
      }
      const result = await pool.query(
        `INSERT INTO reservations (car_id,client_name,client_phone,start_date,end_date,status)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
        [car_id, client_name, client_phone || '', start_date, end_date, status || 'pending']
      );
      return res.json({ id: result.rows[0].id });
    }
    if (req.method === 'PUT') {
      if (!auth(req)) return res.status(401).json({ error: 'Non autorisé' });
      const { id, car_id, client_name, client_phone, start_date, end_date, status } = req.body;
      await pool.query(
        `UPDATE reservations SET car_id=$1,client_name=$2,client_phone=$3,
         start_date=$4,end_date=$5,status=$6 WHERE id=$7`,
        [car_id, client_name, client_phone, start_date, end_date, status, id]
      );
      return res.json({ success: true });
    }
    if (req.method === 'DELETE') {
      if (!auth(req)) return res.status(401).json({ error: 'Non autorisé' });
      const { id } = req.query;
      await pool.query('DELETE FROM reservations WHERE id=$1', [id]);
      return res.json({ success: true });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
