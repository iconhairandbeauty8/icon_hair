import express, { Request, Response } from 'express';
import db from '../config/database';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.get('/', async (req: Request, res: Response) => {
  const branch_id = req.query.branch_id as string | undefined;
  const employee_id = req.query.employee_id as string | undefined;
  const limit = req.query.limit ?? 20;
  try {
    const conditions: string[] = ['r.is_visible = true'];
    const params: unknown[] = [];
    if (branch_id) { conditions.push(`r.branch_id = $${params.length + 1}`); params.push(branch_id); }
    if (employee_id) { conditions.push(`r.employee_id = $${params.length + 1}`); params.push(employee_id); }
    params.push(limit);
    const result = await db.query(`
      SELECT r.*, u.first_name || ' ' || u.last_name as customer_name, u.avatar_url,
        s.name as service_name, e.first_name || ' ' || e.last_name as staff_name
      FROM reviews r
      JOIN users u ON r.customer_id = u.id
      LEFT JOIN services s ON r.service_id = s.id
      LEFT JOIN employees e ON r.employee_id = e.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY r.created_at DESC LIMIT $${params.length}
    `, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/', authenticate, async (req: Request, res: Response) => {
  const { booking_id, rating, comment, employee_id, service_id, branch_id } = req.body as {
    booking_id: string;
    rating: number;
    comment: string;
    employee_id: string;
    service_id: string;
    branch_id: string;
  };
  try {
    const existing = await db.query('SELECT id FROM reviews WHERE booking_id = $1', [booking_id]);
    if (existing.rows[0]) {
      res.status(409).json({ error: 'Review already submitted' });
      return;
    }
    const result = await db.query(`
      INSERT INTO reviews (booking_id, customer_id, employee_id, service_id, branch_id, rating, comment)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *
    `, [booking_id, req.user!.id, employee_id, service_id, branch_id, rating, comment]);

    await db.query(`
      UPDATE employees SET avg_rating = (
        SELECT AVG(rating) FROM reviews WHERE employee_id = $1
      ) WHERE id = $1
    `, [employee_id]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
