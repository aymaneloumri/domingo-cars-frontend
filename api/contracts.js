const pool = require('./db');
const auth = (req) => req.headers['x-admin-token'] === (process.env.ADMIN_PASSWORD || 'domingo2024');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-admin-token');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!auth(req)) return res.status(401).json({ error: 'Non autorisé' });
  try {
    if (req.method === 'GET' && req.query.id) {
      const result = await pool.query('SELECT * FROM contracts WHERE id=$1', [req.query.id]);
      return res.json(result.rows[0] || null);
    }
    if (req.method === 'GET') {
      const result = await pool.query(
        `SELECT ct.*, c.name as car_name FROM contracts ct LEFT JOIN cars c ON ct.car_id = c.id ORDER BY ct.created_at DESC`
      );
      return res.json(result.rows);
    }
    if (req.method === 'POST') {
      const count = await pool.query('SELECT COUNT(*) FROM contracts');
      const contract_number = `DCR-${String(parseInt(count.rows[0].count) + 1).padStart(4, '0')}`;
      const d = req.body;
      const result = await pool.query(
        `INSERT INTO contracts (
          contract_number,contract_date,car_id,matricule,category,brand,model,
          client_name,client_dob,client_phone,client_cin,client_cin_expiry,
          client_address,client_permis,client_permis_expiry,
          driver2_name,driver2_dob,driver2_phone,driver2_cin,driver2_cin_expiry,
          driver2_address,driver2_permis,driver2_permis_expiry,
          nb_days,price_per_day,total,avance,reste,
          depart_datetime,depart_km,depart_inspection,depart_fuel,
          retour_prevu,retour_effectif,retour_km,retour_fuel
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36) RETURNING id, contract_number`,
        [
          contract_number, d.contract_date, d.car_id, d.matricule, d.category, d.brand, d.model,
          d.client_name, d.client_dob, d.client_phone, d.client_cin, d.client_cin_expiry,
          d.client_address, d.client_permis, d.client_permis_expiry,
          d.driver2_name || '', d.driver2_dob || '', d.driver2_phone || '',
          d.driver2_cin || '', d.driver2_cin_expiry || '', d.driver2_address || '',
          d.driver2_permis || '', d.driver2_permis_expiry || '',
          d.nb_days, d.price_per_day, d.total, d.avance, d.reste,
          d.depart_datetime, d.depart_km, d.depart_inspection || 'Aucun point signalé',
          d.depart_fuel || '1/8', d.retour_prevu || '', d.retour_effectif || '',
          d.retour_km || 0, d.retour_fuel || '',
        ]
      );
      return res.json(result.rows[0]);
    }
    if (req.method === 'DELETE') {
      await pool.query('DELETE FROM contracts WHERE id=$1', [req.query.id]);
      return res.json({ success: true });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
