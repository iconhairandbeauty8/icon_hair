import express, { Request, Response } from 'express';
import db from '../config/database';
import { authenticate, authorize } from '../middleware/auth';
import { PoolClient } from 'pg';

const router = express.Router();

router.get('/', async (req: Request, res: Response) => {
  const branch_id = req.query.branch_id as string | undefined;
  const category = req.query.category as string | undefined;
  const employee_id = req.query.employee_id as string | undefined;
  try {
    const conditions: string[] = ['s.is_active = true'];
    const params: unknown[] = [];
    let idx = 1;

    if (branch_id) {
      conditions.push(`EXISTS (SELECT 1 FROM branch_services bs WHERE bs.service_id = s.id AND bs.branch_id = $${idx++})`);
      params.push(branch_id);
    }
    if (employee_id) {
      conditions.push(`EXISTS (SELECT 1 FROM employee_services es WHERE es.service_id = s.id AND es.employee_id = $${idx++})`);
      params.push(employee_id);
    }
    if (category) { conditions.push(`s.category = $${idx++}`); params.push(category); }

    const result = await db.query(`
      SELECT s.*,
        COALESCE(AVG(r.rating), 0) as avg_rating,
        COUNT(DISTINCT r.id) as review_count,
        COUNT(DISTINCT b.id) as booking_count,
        COALESCE(json_agg(DISTINCT bs.branch_id) FILTER (WHERE bs.branch_id IS NOT NULL), '[]') as branch_ids
      FROM services s
      LEFT JOIN reviews r ON r.service_id = s.id
      LEFT JOIN bookings b ON b.service_id = s.id AND b.status = 'completed'
      LEFT JOIN branch_services bs ON bs.service_id = s.id
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
  const { name, category, description, price, duration_minutes, image_url, branch_ids } = req.body as {
    name: string; category: string; description: string; price: number;
    duration_minutes: number; image_url: string; branch_ids?: string[];
  };
  const client: PoolClient = await db.getClient();
  try {
    await client.query('BEGIN');
    const result = await client.query(`
      INSERT INTO services (name, category, description, price, duration_minutes, image_url)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *
    `, [name, category, description, price, duration_minutes, image_url]);

    const service = result.rows[0];
    if (branch_ids?.length) {
      for (const bid of branch_ids) {
        await client.query('INSERT INTO branch_services (branch_id, service_id) VALUES ($1,$2)', [bid, service.id]);
      }
    }
    await client.query('COMMIT');
    res.status(201).json(service);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: (err as Error).message });
  } finally {
    client.release();
  }
});

router.put('/:id', authenticate, authorize('admin', 'manager'), async (req: Request, res: Response) => {
  const { name, category, description, price, duration_minutes, image_url, is_active, branch_ids } = req.body as {
    name: string; category: string; description: string; price: number;
    duration_minutes: number; image_url: string; is_active?: boolean; branch_ids?: string[];
  };
  const client: PoolClient = await db.getClient();
  try {
    await client.query('BEGIN');
    const result = await client.query(`
      UPDATE services SET name=$1, category=$2, description=$3, price=$4, duration_minutes=$5,
        image_url=$6, is_active=$7, updated_at=NOW() WHERE id=$8 RETURNING *
    `, [name, category, description, price, duration_minutes, image_url, is_active ?? true, req.params.id]);

    if (!result.rows[0]) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }

    if (branch_ids !== undefined) {
      await client.query('DELETE FROM branch_services WHERE service_id = $1', [req.params.id]);
      for (const bid of (branch_ids || [])) {
        await client.query('INSERT INTO branch_services (branch_id, service_id) VALUES ($1,$2)', [bid, req.params.id]);
      }
    }
    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: (err as Error).message });
  } finally {
    client.release();
  }
});

export default router;
