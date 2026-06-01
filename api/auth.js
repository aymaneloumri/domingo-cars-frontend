module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-admin-token');
  if (req.method === 'OPTIONS') return res.status(200).end();
  const { password } = req.body;
  if (password === (process.env.ADMIN_PASSWORD || 'domingo2024')) {
    return res.json({ token: process.env.ADMIN_PASSWORD || 'domingo2024', success: true });
  }
  return res.status(401).json({ error: 'Mot de passe incorrect' });
};
