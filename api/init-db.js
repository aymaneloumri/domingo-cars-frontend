const pool = require('./db');

module.exports = async (req, res) => {
  try {
    res.json({ success: true, message: 'DB already initialized via Supabase SQL editor' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
