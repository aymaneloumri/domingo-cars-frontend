const pool = require('./db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cars (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT,
        price_per_day REAL,
        image_url TEXT,
        description TEXT,
        matricule TEXT,
        status TEXT DEFAULT 'active',
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS announcements (
        id SERIAL PRIMARY KEY,
        title TEXT,
        message TEXT,
        start_date TEXT,
        end_date TEXT,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS reservations (
        id SERIAL PRIMARY KEY,
        car_id INTEGER,
        client_name TEXT,
        client_phone TEXT,
        start_date TEXT,
        end_date TEXT,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS contracts (
        id SERIAL PRIMARY KEY,
        contract_number TEXT UNIQUE,
        contract_date TEXT,
        car_id INTEGER,
        matricule TEXT,
        category TEXT,
        brand TEXT,
        model TEXT,
        client_name TEXT,
        client_dob TEXT,
        client_phone TEXT,
        client_cin TEXT,
        client_cin_expiry TEXT,
        client_address TEXT,
        client_permis TEXT,
        client_permis_expiry TEXT,
        driver2_name TEXT,
        driver2_dob TEXT,
        driver2_phone TEXT,
        driver2_cin TEXT,
        driver2_cin_expiry TEXT,
        driver2_address TEXT,
        driver2_permis TEXT,
        driver2_permis_expiry TEXT,
        nb_days INTEGER,
        price_per_day REAL,
        total REAL,
        avance REAL,
        reste REAL,
        depart_datetime TEXT,
        depart_km INTEGER,
        depart_inspection TEXT,
        depart_fuel TEXT,
        retour_prevu TEXT,
        retour_effectif TEXT,
        retour_km INTEGER,
        retour_fuel TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    const count = await pool.query('SELECT COUNT(*) FROM cars');
    if (parseInt(count.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO cars (name, category, price_per_day, status, sort_order) VALUES
        ('Dacia Logan #1', 'Berline', 200, 'active', 1),
        ('Dacia Logan #2', 'Berline', 200, 'active', 2),
        ('Dacia Logan #3', 'Berline', 200, 'active', 3),
        ('Dacia Logan #4', 'Berline', 200, 'active', 4),
        ('Dacia Sandero #1', 'Citadine', 180, 'active', 5),
        ('Dacia Sandero #2', 'Citadine', 180, 'active', 6),
        ('Renault Clio', 'Citadine', 220, 'active', 7),
        ('Opel Corsa #1', 'Citadine', 210, 'active', 8),
        ('Opel Corsa #2', 'Citadine', 210, 'active', 9)
      `);
      await pool.query(`
        INSERT INTO announcements (title, message, start_date, end_date, status)
        VALUES ('Bienvenue chez Domingo Cars Luxury Rent',
        'Profitez de nos tarifs spéciaux pour toute location de 7 jours et plus !',
        '2025-01-01', '2027-12-31', 'active')
      `);
    }

    res.json({ success: true, message: 'Tables created and seeded' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
