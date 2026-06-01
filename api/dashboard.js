const pool = require('./db');
const auth = (req) => req.headers['x-admin-token'] === (process.env.ADMIN_PASSWORD || 'domingo2024');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-admin-token');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!auth(req)) return res.status(401).json({ error: 'Non autorisé' });
  try {
    const today = new Date().toISOString().slice(0, 10);
    const monthStart = today.slice(0, 7) + '-01';
    const monthEnd = today.slice(0, 7) + '-31';
    if (req.query.stats) {
      const totalCars = await pool.query("SELECT COUNT(*) FROM cars WHERE status='active'");
      const rentedToday = await pool.query(
        `SELECT COUNT(DISTINCT car_id) FROM reservations WHERE status IN ('pending','confirmed') AND start_date <= $1 AND end_date > $1`,
        [today]
      );
      const monthlyCount = await pool.query(
        `SELECT COUNT(*) FROM reservations WHERE start_date >= $1 AND start_date <= $2`,
        [monthStart, monthEnd]
      );
      const total = parseInt(totalCars.rows[0].count);
      const rented = parseInt(rentedToday.rows[0].count);
      return res.json({ totalCars: total, rentedToday: rented, availableToday: total - rented, monthlyCount: parseInt(monthlyCount.rows[0].count) });
    }
    if (req.query.calendar) {
      const month = req.query.month || today.slice(0, 7);
      const start = month + '-01';
      const end = month + '-31';
      const cars = await pool.query('SELECT * FROM cars ORDER BY sort_order ASC');
      const reservations = await pool.query(
        `SELECT r.*, c.name as car_name FROM reservations r LEFT JOIN cars c ON r.car_id = c.id WHERE r.start_date <= $1 AND r.end_date >= $2 ORDER BY r.start_date`,
        [end, start]
      );
      return res.json({ cars: cars.rows, reservations: reservations.rows });
    }
    return res.status(400).json({ error: 'Missing query param: stats or calendar' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
