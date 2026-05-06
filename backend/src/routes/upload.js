const express = require('express');
const router = express.Router();
const multer = require('multer');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');

// Use memory storage — buffers held in RAM, stored directly to DB as BYTEA
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files (JPEG, PNG, WebP, GIF) are allowed'), false);
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

// POST /api/upload/single — store one image as binary in DB
router.post('/single', authenticate, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const folder = req.query.folder || 'general';
  const userId = req.user?.id || null;

  try {
    const result = await db.query(
      `INSERT INTO images (data, mime_type, filename, file_size, folder, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, mime_type, filename, file_size, folder, created_at`,
      [req.file.buffer, req.file.mimetype, req.file.originalname, req.file.size, folder, userId]
    );

    const image = result.rows[0];
    const url = `/api/images/${image.id}`;
    res.json({ url, id: image.id, filename: image.filename, size: image.file_size });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Failed to store image' });
  }
});

// POST /api/upload/multiple — store multiple images as binary in DB
router.post('/multiple', authenticate, upload.array('images', 10), async (req, res) => {
  if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No files uploaded' });

  const folder = req.query.folder || 'general';
  const userId = req.user?.id || null;

  try {
    const urls = [];
    for (const file of req.files) {
      const result = await db.query(
        `INSERT INTO images (data, mime_type, filename, file_size, folder, uploaded_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [file.buffer, file.mimetype, file.originalname, file.size, folder, userId]
      );
      urls.push(`/api/images/${result.rows[0].id}`);
    }
    res.json({ urls });
  } catch (err) {
    console.error('Multi-upload error:', err);
    res.status(500).json({ error: 'Failed to store images' });
  }
});

// Multer error handler
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
    return res.status(400).json({ error: err.message });
  }
  if (err) return res.status(400).json({ error: err.message });
  next();
});

module.exports = router;
