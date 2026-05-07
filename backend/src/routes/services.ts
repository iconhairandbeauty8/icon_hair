import express, { Request, Response } from 'express';
import db from '../config/database';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

router.get('/', async (req: Request, res: Response) => {
  const category = req.query.category as string | undefined;
  const employee_id = req.query.employee_id as string | undefined;
  try {
    const conditions: string[] = ['s.is_active = true'];
    const params: unknown[] = [];
    let idx = 1;

    if (employee_id) {
      conditions.push(`EXISTS (SELECT 1 FROM employee_services es WHERE es.service_id = s.id AND es.employee_id = $${idx++})`);
      params.push(employee_id);
    }
    if (category) { conditions.push(`s.category = $${idx++}`); params.push(category); }

    const result = await db.query(`
      SELECT s.*,
        COALESCE(AVG(r.rating), 0) as avg_rating,
        COUNT(DISTINCT r.id) as review_count,
        COUNT(DISTINCT b.id) as booking_count
      FROM services s
      LEFT JOIN reviews r ON r.service_id = s.id
      LEFT JOIN bookings b ON b.service_id = s.id AND b.status = 'completed'
      WHERE ${conditions.join(' AND ')}
      GROUP BY s.id
      ORDER BY s.category, s.name
    `, params);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/categories', async (_req: Request, res: Response) => {
  try {
    const result = await db.query(`
      SELECT category, COUNT(*) as service_count FROM services
      WHERE is_active = true GROUP BY category ORDER BY category
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/', authenticate, authorize('admin', 'manager'), async (req: Request, res: Response) => {
  const { name, category, description, price, duration_minutes, image_url } = req.body as {
    name: string; category: string; description: string; price: number;
    duration_minutes: number; image_url: string;
  };
  try {
    const result = await db.query(`
      INSERT INTO services (name, category, description, price, duration_minutes, image_url)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *
    `, [name, category, description, price, duration_minutes, image_url]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.put('/:id', authenticate, authorize('admin', 'manager'), async (req: Request, res: Response) => {
  const { name, category, description, price, duration_minutes, image_url, is_active } = req.body as {
    name: string; category: string; description: string; price: number;
    duration_minutes: number; image_url: string; is_active?: boolean;
  };
  try {
    const result = await db.query(`
      UPDATE services SET name=$1, category=$2, description=$3, price=$4, duration_minutes=$5,
        image_url=$6, is_active=$7, updated_at=NOW() WHERE id=$8 RETURNING *
    `, [name, category, description, price, duration_minutes, image_url, is_active ?? true, req.params.id]);

    if (!result.rows[0]) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
