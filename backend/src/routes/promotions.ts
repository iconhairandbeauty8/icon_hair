import express, { Request, Response } from 'express';
import db from '../config/database';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await db.query(`
      SELECT * FROM promotions WHERE is_active = true AND (end_date IS NULL OR end_date >= NOW())
      ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/', authenticate, authorize('admin', 'manager'), async (req: Request, res: Response) => {
  const { title, description, type, discount_type, discount_value, start_date, end_date, code, image_url, branch_id, applicable_services } = req.body as {
    title: string; description: string; type: string; discount_type: string;
    discount_value: number; start_date: string; end_date: string; code: string;
    image_url: string; branch_id: string; applicable_services: string[];
  };
  try {
    const result = await db.query(`
      INSERT INTO promotions (title, description, type, discount_type, discount_value, start_date, end_date, code, image_url, branch_id, applicable_services)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *
    `, [title, description, type, discount_type, discount_value, start_date, end_date, code, image_url, branch_id, JSON.stringify(applicable_services)]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/validate', async (req: Request, res: Response) => {
  const { code, service_id, amount } = req.body as { code: string; service_id: string; amount: number };
  try {
    const result = await db.query(`
      SELECT * FROM promotions WHERE code = $1 AND is_active = true
      AND (start_date IS NULL OR start_date <= NOW())
      AND (end_date IS NULL OR end_date >= NOW())
    `, [code]);
    if (!result.rows[0]) {
      res.status(404).json({ error: 'Invalid or expired promo code' });
      return;
    }
    const promo = result.rows[0];
    const discount = promo.discount_type === 'percentage'
      ? amount * (promo.discount_value / 100)
      : promo.discount_value;
    res.json({ valid: true, promo, discount, final_amount: Math.max(0, amount - discount) });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
