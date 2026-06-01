const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-admin-token');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = req.headers['x-admin-token'];
  if (token !== (process.env.ADMIN_PASSWORD || 'domingo2024')) {
    return res.status(401).json({ error: 'Non autorisé' });
  }

  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'domingo-cars' },
        (err, result) => (err ? reject(err) : resolve(result))
      );
      Readable.from(buffer).pipe(stream);
    });

    return res.json({ url: result.secure_url });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports.config = {
  api: { bodyParser: false },
};
