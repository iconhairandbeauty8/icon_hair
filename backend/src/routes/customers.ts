import express, { Request, Response } from 'express';
import db from '../config/database';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticate, authorize('admin', 'manager'), async (req: Request, res: Response) => {
  const search = req.query.search as string | undefined;
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const offset = (page - 1) * limit;
  try {
    const conditions: string[] = ["r.name = 'customer'"];
    const params: unknown[] = [];
    if (search) {
      conditions.push(`(u.first_name ILIKE $${params.length + 1} OR u.last_name ILIKE $${params.length + 1} OR u.email ILIKE $${params.length + 1})`);
      params.push(`%${search}%`);
    }
    params.push(limit, offset);
    const result = await db.query(`
      SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.avatar_url, u.created_at,
        COUNT(DISTINCT b.id) as total_bookings,
        COALESCE(SUM(CASE WHEN b.status='completed' THEN b.price END), 0) as total_spent,
        MAX(b.start_time) as last_visit,
        lp.membership_tier
      FROM users u
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN bookings b ON b.customer_id = u.id
      LEFT JOIN loyalty_profiles lp ON lp.customer_id = u.id
      WHERE ${conditions.join(' AND ')}
      GROUP BY u.id, lp.membership_tier
      ORDER BY u.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
