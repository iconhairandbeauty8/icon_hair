import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import db from '../config/database';
import { authenticate, authorize } from '../middleware/auth';
import { PoolClient } from 'pg';

const router = express.Router();

router.get('/', async (req: Request, res: Response) => {
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
      WHERE e.is_active = true
      GROUP BY e.id
      ORDER BY e.first_name
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const empResult = await db.query(`
      SELECT e.*,
        json_agg(DISTINCT s.name) FILTER (WHERE s.id IS NOT NULL) as services,
        json_agg(DISTINCT es.service_id) FILTER (WHERE es.service_id IS NOT NULL) as service_ids,
        COALESCE(AVG(r.rating), 0) as avg_rating,
        COUNT(DISTINCT r.id) as review_count
      FROM employees e
      LEFT JOIN employee_services es ON es.employee_id = e.id
      LEFT JOIN services s ON es.service_id = s.id
      LEFT JOIN reviews r ON r.employee_id = e.id
      WHERE e.user_id = $1
      GROUP BY e.id
    `, [req.user!.id]);

    if (!empResult.rows[0]) {
      res.status(404).json({ error: 'Staff profile not found' });
      return;
    }

    const bookings = await db.query(`
      SELECT b.*, s.name as service_name,
        u.first_name as customer_first_name, u.last_name as customer_last_name
      FROM bookings b
      LEFT JOIN services s ON b.service_id = s.id
      LEFT JOIN users u ON b.customer_id = u.id
      WHERE b.employee_id = $1 AND b.start_time >= NOW()
      ORDER BY b.start_time
      LIMIT 50
    `, [empResult.rows[0].id]);

    res.json({ employee: empResult.rows[0], bookings: bookings.rows });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/bookings', authenticate, async (req: Request, res: Response) => {
  try {
    const empResult = await db.query(
      'SELECT id FROM employees WHERE user_id = $1',
      [req.user!.id]
    );
    if (!empResult.rows[0]) {
      res.status(404).json({ error: 'Staff profile not found' });
      return;
    }
    const dateFrom = req.query.date_from ? String(req.query.date_from) : null;
    const dateTo   = req.query.date_to   ? String(req.query.date_to)   : null;

    const result = await db.query(`
      SELECT b.id, b.reference, b.start_time, b.end_time, b.status, b.price, b.notes,
        s.name  AS service_name,
        u.first_name AS customer_first_name,
        u.last_name  AS customer_last_name,
        u.phone      AS customer_phone
      FROM bookings b
      LEFT JOIN services s ON b.service_id = s.id
      LEFT JOIN users    u ON b.customer_id = u.id
      WHERE b.employee_id = $1
        AND ($2::date IS NULL OR b.start_time >= $2::date)
        AND ($3::date IS NULL OR b.start_time <  ($3::date + INTERVAL '1 day'))
      ORDER BY b.start_time
      LIMIT 300
    `, [empResult.rows[0].id, dateFrom, dateTo]);

    res.json({ bookings: result.rows });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/', authenticate, authorize('admin', 'manager'), async (req: Request, res: Response) => {
  const { first_name, last_name, email, phone, role, bio, image_url, experience_years, service_ids, schedule, login_password } = req.body as {
    first_name: string; last_name: string; email?: string; phone?: string;
    role: string; bio?: string; image_url?: string;
    experience_years?: number; service_ids?: string[]; schedule?: object;
    login_password?: string;
  };
  const client: PoolClient = await db.getClient();
  try {
    await client.query('BEGIN');

    // Create login account if password provided
    let userId: string | null = null;
    if (login_password && email) {
      const hashed = await bcrypt.hash(login_password, 12);
      const staffRole = await client.query("SELECT id FROM roles WHERE name = 'staff'");
      const staffRoleId = staffRole.rows[0]?.id as string;
      const existing = await client.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existing.rows[0]) {
        userId = existing.rows[0].id as string;
        await client.query('UPDATE users SET role_id=$1, password_hash=$2 WHERE id=$3', [staffRoleId, hashed, userId]);
      } else {
        const uRes = await client.query(
          'INSERT INTO users (email, password_hash, first_name, last_name, phone, role_id) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
          [email, hashed, first_name, last_name, phone || null, staffRoleId]
        );
        userId = uRes.rows[0].id as string;
      }
    }

    const result = await client.query(`
      INSERT INTO employees (first_name, last_name, email, phone, role, bio, image_url, experience_years, schedule, user_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *
    `, [first_name, last_name, email || null, phone || null, role, bio || null, image_url || null, experience_years || 0, JSON.stringify(schedule || {}), userId]);

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
  const { first_name, last_name, email, phone, role, bio, image_url, experience_years, service_ids, schedule, is_active, login_password } = req.body as {
    first_name: string; last_name: string; email?: string; phone?: string;
    role: string; bio?: string; image_url?: string; experience_years?: number;
    service_ids?: string[]; schedule?: object; is_active?: boolean; login_password?: string;
  };
  const client: PoolClient = await db.getClient();
  try {
    await client.query('BEGIN');

    // Set or reset login password for existing staff
    if (login_password && email) {
      const hashed = await bcrypt.hash(login_password, 12);
      const staffRole = await client.query("SELECT id FROM roles WHERE name = 'staff'");
      const staffRoleId = staffRole.rows[0]?.id as string;

      // Does this employee already have a linked user account?
      const empRow = await client.query('SELECT user_id FROM employees WHERE id = $1', [req.params.id]);
      const existingUserId = empRow.rows[0]?.user_id as string | null;

      if (existingUserId) {
        // Just update the password
        await client.query('UPDATE users SET password_hash=$1 WHERE id=$2', [hashed, existingUserId]);
      } else {
        // Check if a user with this email already exists
        const byEmail = await client.query('SELECT id FROM users WHERE email = $1', [email]);
        let newUserId: string;
        if (byEmail.rows[0]) {
          newUserId = byEmail.rows[0].id as string;
          await client.query('UPDATE users SET role_id=$1, password_hash=$2 WHERE id=$3', [staffRoleId, hashed, newUserId]);
        } else {
          const uRes = await client.query(
            'INSERT INTO users (email, password_hash, first_name, last_name, phone, role_id) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
            [email, hashed, first_name, last_name, phone || null, staffRoleId]
          );
          newUserId = uRes.rows[0].id as string;
        }
        await client.query('UPDATE employees SET user_id=$1 WHERE id=$2', [newUserId, req.params.id]);
      }
    }

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
