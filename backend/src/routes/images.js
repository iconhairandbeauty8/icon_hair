const express = require('express');
const router = express.Router();
const db = require('../config/database');

/**
 * GET /api/images/:id
 * Serves a binary image stored in the images table.
 * No auth required — images are public (referenced by opaque UUID).
 */
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT data, mime_type, filename, file_size FROM images WHERE id = $1',
      [req.params.id]
    );

    if (!result.rows[0]) return res.status(404).json({ error: 'Image not found' });

    const { data, mime_type, filename, file_size } = result.rows[0];

    // data is a Buffer when using the pg driver with BYTEA columns
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);

    res.set({
      'Content-Type': mime_type || 'image/jpeg',
      'Content-Length': buffer.length,
      'Cache-Control': 'public, max-age=31536000, immutable', // cache for 1 year
      'Content-Disposition': `inline; filename="${filename || 'image'}"`,
    });

    res.send(buffer);
  } catch (err) {
    console.error('Image serve error:', err);
    res.status(500).json({ error: 'Failed to serve image' });
  }
});

module.exports = router;
