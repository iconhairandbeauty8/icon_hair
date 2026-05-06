import express, { Request, Response } from 'express';
import db from '../config/database';
import { authenticate, authorize } from '../middleware/auth';
import { PoolClient } from 'pg';

const router = express.Router();

router.get('/', async (req: Request, res: Response) => {
  const branch_id = req.query.branch_id as string | undefined;
  try {
    const result = await db.query(`
      SELECT e.*,
        json_agg(DISTINCT s.name) FILTER (WHERE s.id IS NOT NULL) as services,
        json_agg(DISTINCT es.service_id) FILTER (WHERE es.service_id IS NOT NULL) as service_ids,
        COALESCE(AVG(r.rating), 0) as avg_rating,
        COUNT(DISTINCT r.id) as review_count,
        COUNT(DISTINCT b.id) as total_bookings
      FROM employees e
      LEFT JOIN employee_services es ON es.employee_id = e.id
      LEFT JOIN services s ON es.service_id = s.id
      LEFT JOIN reviews r ON r.employee_id = e.id
      LEFT JOIN bookings b ON b.employee_id = e.id AND b.status = 'completed'
      WHERE e.is_active = true ${branch_id ? 'AND e.branch_id = $1' : ''}
      GROUP BY e.id
      ORDER BY e.first_name
    `, branch_id ? [branch_id] : []);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/', authenticate, authorize('admin', 'manager'), async (req: Request, res: Response) => {
  const { first_name, last_name, email, phone, role, branch_id, bio, image_url, experience_years, service_ids, schedule } = req.body as {
    first_name: string; last_name: string; email?: string; phone?: string;
    role: string; branch_id: string; bio?: string; image_url?: string;
    experience_years?: number; service_ids?: string[]; schedule?: object;
  };
  const client: PoolClient = await db.getClient();
  try {
    await client.query('BEGIN');
    const result = await client.query(`
      INSERT INTO employees (first_name, last_name, email, phone, role, branch_id, bio, image_url, experience_years, schedule)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *
    `, [first_name, last_name, email || null, phone || null, role, branch_id, bio || null, image_url || null, experience_years || 0, JSON.stringify(schedule || {})]);

    const employee = result.rows[0];
    if (service_ids?.length) {
      for (const sid of service_ids) {
        await client.query('INSERT INTO employee_services (employee_id, service_id) VALUES ($1,$2)', [employee.id, sid]);
      }
    }
    await client.query('COMMIT');
    res.status(201).json(employee);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('POST /staff error:', (err as Error).message);
    res.status(500).json({ error: (err as Error).message });
  } finally {
    client.release();
  }
});

router.put('/:id', authenticate, authorize('admin', 'manager'), async (req: Request, res: Response) => {
  const { first_name, last_name, email, phone, role, bio, image_url, experience_years, service_ids, schedule, is_active } = req.body as {
    first_name: string; last_name: string; email?: string; phone?: string;
    role: string; bio?: string; image_url?: string; experience_years?: number;
    service_ids?: string[]; schedule?: object; is_active?: boolean;
  };
  const client: PoolClient = await db.getClient();
  try {
    await client.query('BEGIN');
    const result = await client.query(`
      UPDATE employees SET first_name=$1, last_name=$2, email=$3, phone=$4, role=$5, bio=$6,
        image_url=$7, experience_years=$8, schedule=$9, is_active=$10, updated_at=NOW()
      WHERE id=$11 RETURNING *
    `, [
      first_name, last_name, email || null, phone || null, role,
      bio || null, image_url || null, experience_years || 0,
      JSON.stringify(schedule || {}),
      is_active !== undefined ? is_active : true,
      req.params.id,
    ]);

    if (!result.rows[0]) {
      res.status(404).json({ error: 'Staff member not found' });
      return;
    }

    if (service_ids !== undefined) {
      await client.query('DELETE FROM employee_services WHERE employee_id = $1', [req.params.id]);
      for (const sid of (service_ids || [])) {
        await client.query('INSERT INTO employee_services (employee_id, service_id) VALUES ($1,$2)', [req.params.id, sid]);
      }
    }
    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('PUT /staff error:', (err as Error).message);
    res.status(500).json({ error: (err as Error).message });
  } finally {
    client.release();
  }
});

export default router;
