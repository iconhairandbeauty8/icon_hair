import express, { Request, Response, NextFunction } from 'express';
import multer, { MulterError } from 'multer';
import db from '../config/database';
import { authenticate } from '../middleware/auth';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files (JPEG, PNG, WebP, GIF) are allowed'));
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post('/single', authenticate, upload.single('image'), async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }

  const folder = (req.query.folder as string) || 'general';
  const userId = req.user?.id ?? null;

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

router.post('/multiple', authenticate, upload.array('images', 10), async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[] | undefined;
  if (!files || files.length === 0) {
    res.status(400).json({ error: 'No files uploaded' });
    return;
  }

  const folder = (req.query.folder as string) || 'general';
  const userId = req.user?.id ?? null;

  try {
    const urls: string[] = [];
    for (const file of files) {
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

router.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
      return;
    }
    res.status(400).json({ error: err.message });
    return;
  }
  if (err) {
    res.status(400).json({ error: err.message });
    return;
  }
  _next();
});

export default router;
