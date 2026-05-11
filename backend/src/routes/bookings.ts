import express, { Request, Response } from 'express';
import db from '../config/database';
import { authenticate } from '../middleware/auth';
import { PoolClient } from 'pg';

const router = express.Router();

router.get('/availability', async (req: Request, res: Response) => {
  const employee_id = req.query.employee_id as string | undefined;
  const service_id = req.query.service_id as string | undefined;
  const date = req.query.date as string | undefined;

  if (!service_id || !date) {
    res.status(400).json({ error: 'service_id and date are required' });
    return;
  }
  try {
    const serviceResult = await db.query('SELECT duration_minutes FROM services WHERE id = $1', [service_id]);
    if (!serviceResult.rows[0]) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }
    const duration: number = serviceResult.rows[0].duration_minutes;

    // Generate candidate slots at 30-minute intervals within opening hours
    const openMins = 9 * 60;   // 09:00
    const closeMins = 18 * 60; // 18:00
    const allSlots: number[] = [];
    for (let t = openMins; t + duration <= closeMins; t += 30) {
      allSlots.push(t);
    }

    const toTimeStr = (mins: number) =>
      `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;

    if (employee_id) {
      // Specific staff: remove slots that overlap with their existing bookings.
      // Use AT TIME ZONE so extraction is correct regardless of server timezone.
      const { rows: bookings } = await db.query(`
        SELECT
          EXTRACT(HOUR FROM start_time AT TIME ZONE 'Pacific/Auckland') * 60 +
          EXTRACT(MINUTE FROM start_time AT TIME ZONE 'Pacific/Auckland') AS start_mins,
          EXTRACT(HOUR FROM end_time AT TIME ZONE 'Pacific/Auckland') * 60 +
          EXTRACT(MINUTE FROM end_time AT TIME ZONE 'Pacific/Auckland') AS end_mins
        FROM bookings
        WHERE employee_id = $1
          AND (start_time AT TIME ZONE 'Pacific/Auckland')::date = $2::date
          AND status IN ('pending', 'confirmed')
      `, [employee_id, date]);

      const available = allSlots.filter(slotStart => {
        const slotEnd = slotStart + duration;
        return !bookings.some(b =>
          slotStart < Number(b.end_mins) && slotEnd > Number(b.start_mins)
        );
      });

      res.json({ slots: available.map(toTimeStr), duration, date });
    } else {
      // Any available: find all staff qualified for this service, then return
      // slots where at least one of them is free for the full service duration.
      const { rows: staffRows } = await db.query(`
        SELECT DISTINCT e.id
        FROM employees e
        JOIN employee_services es ON es.employee_id = e.id
        WHERE es.service_id = $1 AND e.is_active = true
      `, [service_id]);

      if (!staffRows.length) {
        res.json({ slots: [], duration, date });
        return;
      }

      const staffIds: string[] = (staffRows as Array<{ id: string }>).map(r => r.id);

      const { rows: bookingsRaw } = await db.query(`
        SELECT
          employee_id,
          EXTRACT(HOUR FROM start_time AT TIME ZONE 'Pacific/Auckland') * 60 +
          EXTRACT(MINUTE FROM start_time AT TIME ZONE 'Pacific/Auckland') AS start_mins,
          EXTRACT(HOUR FROM end_time AT TIME ZONE 'Pacific/Auckland') * 60 +
          EXTRACT(MINUTE FROM end_time AT TIME ZONE 'Pacific/Auckland') AS end_mins
        FROM bookings
        WHERE employee_id = ANY($1)
          AND (start_time AT TIME ZONE 'Pacific/Auckland')::date = $2::date
          AND status IN ('pending', 'confirmed')
      `, [staffIds, date]);

      const bookings = bookingsRaw as Array<{ employee_id: string; start_mins: unknown; end_mins: unknown }>;

      // Slot is available if at least one qualified staff member has no conflict
      const available = allSlots.filter(slotStart => {
        const slotEnd = slotStart + duration;
        return staffIds.some(staffId => {
          const staffBookings = bookings.filter(b => b.employee_id === staffId);
          return !staffBookings.some(b =>
            slotStart < Number(b.end_mins) && slotEnd > Number(b.start_mins)
          );
        });
      });

      res.json({ slots: available.map(toTimeStr), duration, date });
    }
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/', authenticate, async (req: Request, res: Response) => {
  const employee_id = req.query.employee_id as string | undefined;
  const date_from = req.query.date_from as string | undefined;
  const date_to = req.query.date_to as string | undefined;
  const status = req.query.status as string | undefined;
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const offset = (page - 1) * limit;

  try {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (req.user!.role_name === 'customer') { conditions.push(`b.customer_id = $${idx++}`); params.push(req.user!.id); }
    if (req.user!.role_name === 'staff') {
      const empRow = await db.query('SELECT id FROM employees WHERE user_id = $1', [req.user!.id]);
      if (empRow.rows[0]) { conditions.push(`b.employee_id = $${idx++}`); params.push(empRow.rows[0].id); }
    }
    if (employee_id) { conditions.push(`b.employee_id = $${idx++}`); params.push(employee_id); }
    if (status) { conditions.push(`b.status = $${idx++}`); params.push(status); }
    if (date_from) { conditions.push(`b.start_time >= $${idx++}`); params.push(date_from); }
    if (date_to) { conditions.push(`b.start_time <= $${idx++}`); params.push(date_to + ' 23:59:59'); }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const result = await db.query(`
      SELECT b.*,
        u.first_name || ' ' || u.last_name as customer_name, u.email as customer_email, u.phone as customer_phone,
        e.first_name || ' ' || e.last_name as staff_name, e.image_url as staff_image,
        s.name as service_name, s.duration_minutes, s.price
      FROM bookings b
      JOIN users u ON b.customer_id = u.id
      JOIN employees e ON b.employee_id = e.id
      JOIN services s ON b.service_id = s.id
      ${where}
      ORDER BY b.start_time DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `, [...params, limit, offset]);

    const countResult = await db.query(`SELECT COUNT(*) FROM bookings b ${where}`, params);

    res.json({
      bookings: result.rows,
      total: parseInt(countResult.rows[0].count as string),
      page,
      pages: Math.ceil(parseInt(countResult.rows[0].count as string) / limit),
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/', authenticate, async (req: Request, res: Response) => {
  const { service_id, start_time, notes, voucher_code, promotion_id } = req.body as {
    service_id: string; start_time: string;
    notes?: string; voucher_code?: string; promotion_id?: string;
  };
  let { employee_id } = req.body as { employee_id?: string };
  const isAdminRole = req.user!.role_name === 'admin' || req.user!.role_name === 'manager';
  const customerId: string = (isAdminRole && (req.body as any).customer_id)
    ? (req.body as any).customer_id
    : req.user!.id;
  const client: PoolClient = await db.getClient();

  try {
    await client.query('BEGIN');

    const serviceResult = await client.query('SELECT * FROM services WHERE id = $1', [service_id]);
    const service = serviceResult.rows[0];
    if (!service) throw new Error('Service not found');

    // Interpret the naive timestamp from the frontend as Auckland local time.
    // Using AT TIME ZONE in SQL is reliable regardless of server/Node.js timezone.
    const durMins = service.duration_minutes as number;

    if (!employee_id) {
      const available = await client.query(`
        SELECT e.id FROM employees e
        JOIN employee_services es ON es.employee_id = e.id
        WHERE es.service_id = $1 AND e.is_active = true
        AND NOT EXISTS (
          SELECT 1 FROM bookings b
          WHERE b.employee_id = e.id
          AND b.status IN ('pending','confirmed')
          AND (
            ($2::timestamp AT TIME ZONE 'Pacific/Auckland') < b.end_time
            AND ($2::timestamp AT TIME ZONE 'Pacific/Auckland' + ($3 * interval '1 minute')) > b.start_time
          )
        )
        LIMIT 1
      `, [service_id, start_time, durMins]);
      if (!available.rows[0]) throw new Error('No staff available for this time slot');
      employee_id = available.rows[0].id as string;
    }

    const conflict = await client.query(`
      SELECT id FROM bookings
      WHERE employee_id = $1
      AND status IN ('pending', 'confirmed')
      AND (
        ($2::timestamp AT TIME ZONE 'Pacific/Auckland') < end_time
        AND ($2::timestamp AT TIME ZONE 'Pacific/Auckland' + ($3 * interval '1 minute')) > start_time
      )
    `, [employee_id, start_time, durMins]);

    if (conflict.rows.length > 0) throw new Error('Time slot no longer available');

    let finalPrice: number = service.price;
    let loyaltyDiscountPct = 0;
    let voucherId: string | null = null;

    // Apply loyalty tier discount
    const loyaltyResult = await client.query(`
      SELECT lp.membership_tier, ls.tiers
      FROM loyalty_profiles lp
      LEFT JOIN loyalty_settings ls ON ls.id = 1
      WHERE lp.customer_id = $1
    `, [customerId]);
    if (loyaltyResult.rows[0]) {
      const { membership_tier, tiers } = loyaltyResult.rows[0] as { membership_tier: string; tiers: any[] };
      if (Array.isArray(tiers)) {
        const tierConfig = tiers.find((t: any) => t.key === membership_tier);
        if (tierConfig?.discount > 0) {
          loyaltyDiscountPct = tierConfig.discount;
          finalPrice = finalPrice * (1 - loyaltyDiscountPct / 100);
        }
      }
    }

    // Apply promotion discount
    if (promotion_id) {
      const bookingDate = start_time.split('T')[0];
      const promoResult = await client.query(`
        SELECT * FROM promotions
        WHERE id = $1 AND is_active = true
          AND (end_date IS NULL OR end_date >= NOW())
          AND (
            jsonb_array_length(COALESCE(applicable_dates, '[]'::jsonb)) = 0
            OR COALESCE(applicable_dates, '[]'::jsonb) @> jsonb_build_array($2::text)
          )
          AND (
            jsonb_array_length(COALESCE(applicable_services, '[]'::jsonb)) = 0
            OR COALESCE(applicable_services, '[]'::jsonb) @> jsonb_build_array($3::text)
          )
      `, [promotion_id, bookingDate, service_id]);

      if (promoResult.rows[0]) {
        const promo = promoResult.rows[0];
        const promoDiscount = promo.discount_type === 'percentage'
          ? finalPrice * (promo.discount_value / 100)
          : Number(promo.discount_value);
        finalPrice = Math.max(0, finalPrice - promoDiscount);
      }
    }

    if (voucher_code) {
      const voucher = await client.query(
        `SELECT * FROM gift_vouchers WHERE code = $1 AND is_redeemed = false AND expires_at > NOW()`,
        [voucher_code]
      );
      if (voucher.rows[0]) {
        voucherId = voucher.rows[0].id as string;
        finalPrice = Math.max(0, finalPrice - (voucher.rows[0].amount as number));
      }
    }

    const result = await client.query(`
      INSERT INTO bookings (customer_id, employee_id, service_id, start_time, end_time, price, notes, voucher_id, status)
      VALUES (
        $1, $2, $3,
        $4::timestamp AT TIME ZONE 'Pacific/Auckland',
        $4::timestamp AT TIME ZONE 'Pacific/Auckland' + ($5 * interval '1 minute'),
        $6, $7, $8, 'pending'
      ) RETURNING *
    `, [customerId, employee_id, service_id, start_time, durMins, finalPrice, notes, voucherId]);

    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: (err as Error).message });
  } finally {
    client.release();
  }
});

router.put('/:id/status', authenticate, async (req: Request, res: Response) => {
  const { status } = req.body as { status: string };
  const validStatuses = ['confirmed', 'cancelled', 'completed', 'no_show', 'finished'];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: 'Invalid status' });
    return;
  }

  try {
    const result = await db.query(
      'UPDATE bookings SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *',
      [status, req.params.id]
    );

    if (status === 'completed') {
      await db.query(`
        UPDATE inventory_items SET quantity = quantity - isr.quantity_used
        FROM inventory_service_requirements isr
        WHERE isr.service_id = (SELECT service_id FROM bookings WHERE id = $1)
        AND inventory_items.id = isr.inventory_item_id
      `, [req.params.id]);

      const booking = result.rows[0];
      await db.query(`
        INSERT INTO loyalty_points (customer_id, points, description, booking_id)
        VALUES ($1, $2, 'Service completed', $3)
        ON CONFLICT DO NOTHING
      `, [booking.customer_id, Math.floor(booking.price as number), booking.id]);
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.put('/:id/reschedule', authenticate, async (req: Request, res: Response) => {
  const { start_time, employee_id } = req.body as { start_time: string; employee_id?: string };
  try {
    const bookingResult = await db.query(
      `SELECT b.*, s.duration_minutes FROM bookings b JOIN services s ON b.service_id = s.id WHERE b.id = $1`,
      [req.params.id]
    );
    const booking = bookingResult.rows[0];
    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    const result = await db.query(`
      UPDATE bookings
      SET
        start_time = $1::timestamp AT TIME ZONE 'Pacific/Auckland',
        end_time   = $1::timestamp AT TIME ZONE 'Pacific/Auckland' + ($2 * interval '1 minute'),
        employee_id = COALESCE($3, employee_id),
        updated_at = NOW()
      WHERE id = $4 RETURNING *
    `, [start_time, booking.duration_minutes as number, employee_id, req.params.id]);

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.put('/:id/reassign', authenticate, async (req: Request, res: Response) => {
  const { employee_id } = req.body as { employee_id: string };
  if (!employee_id) { res.status(400).json({ error: 'employee_id is required' }); return; }

  try {
    const bookingResult = await db.query('SELECT * FROM bookings WHERE id = $1', [req.params.id]);
    const booking = bookingResult.rows[0];
    if (!booking) { res.status(404).json({ error: 'Booking not found' }); return; }

    // Check new staff has no conflict at this time
    const conflict = await db.query(`
      SELECT id FROM bookings
      WHERE employee_id = $1
        AND id != $2
        AND status IN ('pending', 'confirmed')
        AND ($3 < end_time AND $4 > start_time)
    `, [employee_id, req.params.id, booking.start_time, booking.end_time]);

    if (conflict.rows.length > 0) {
      res.status(409).json({ error: 'Selected staff member has a conflict at this time' });
      return;
    }

    const result = await db.query(
      'UPDATE bookings SET employee_id = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [employee_id, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.put('/:id/finish', authenticate, async (req: Request, res: Response) => {
  if (req.user!.role_name !== 'staff') {
    res.status(403).json({ error: 'Staff only' });
    return;
  }
  try {
    // employees.id != users.id — look up the employee record first
    const empResult = await db.query('SELECT id FROM employees WHERE user_id = $1', [req.user!.id]);
    if (!empResult.rows[0]) {
      res.status(404).json({ error: 'Staff profile not found' });
      return;
    }
    const employeeId: string = empResult.rows[0].id;

    const result = await db.query(`
      UPDATE bookings
      SET status = 'finished',
          end_time = NOW(),
          updated_at = NOW()
      WHERE id = $1
        AND employee_id = $2
        AND status IN ('pending', 'confirmed')
      RETURNING *
    `, [req.params.id, employeeId]);

    if (!result.rows[0]) {
      res.status(404).json({ error: 'Booking not found or already finished' });
      return;
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/pending-review', authenticate, async (req: Request, res: Response) => {
  if (req.user!.role_name !== 'customer') { res.json({ booking: null }); return; }
  try {
    const result = await db.query(`
      SELECT b.id, b.start_time,
        s.name as service_name,
        e.first_name || ' ' || e.last_name as staff_name
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN employees e ON b.employee_id = e.id
      WHERE b.customer_id = $1
        AND b.status = 'completed'
        AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.booking_id = b.id)
      ORDER BY b.start_time DESC
      LIMIT 1
    `, [req.user!.id]);
    res.json({ booking: result.rows[0] || null });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const result = await db.query(`
      SELECT b.*,
        u.first_name || ' ' || u.last_name as customer_name, u.email as customer_email, u.phone as customer_phone,
        e.first_name || ' ' || e.last_name as staff_name, e.image_url as staff_image, e.role as staff_role,
        s.name as service_name, s.duration_minutes, s.price, s.description as service_description,
        p.status as payment_status, p.amount as payment_amount, p.payment_method
      FROM bookings b
      JOIN users u ON b.customer_id = u.id
      JOIN employees e ON b.employee_id = e.id
      JOIN services s ON b.service_id = s.id
      LEFT JOIN payments p ON p.booking_id = b.id
      WHERE b.id = $1
    `, [req.params.id]);

    if (!result.rows[0]) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
