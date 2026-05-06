import express, { Request, Response } from 'express';
import db from '../config/database';
import { ImageRecord } from '../types';

const router = express.Router();

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const result = await db.query<ImageRecord>(
      'SELECT data, mime_type, filename, file_size FROM images WHERE id = $1',
      [req.params.id]
    );

    if (!result.rows[0]) {
      res.status(404).json({ error: 'Image not found' });
      return;
    }

    const { data, mime_type, filename, file_size } = result.rows[0];
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);

    res.set({
      'Content-Type': mime_type || 'image/jpeg',
      'Content-Length': String(buffer.length),
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Disposition': `inline; filename="${filename || 'image'}"`,
    });

    res.send(buffer);
  } catch (err) {
    console.error('Image serve error:', err);
    res.status(500).json({ error: 'Failed to serve image' });
  }
});

export default router;
