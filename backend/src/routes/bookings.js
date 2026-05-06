const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/bookings/availability - check available slots
router.get('/availability', async (req, res) => {
  const { branch_id, employee_id, service_id, date } = req.query;
  if (!branch_id || !service_id || !date) {
    return res.status(400).json({ error: 'branch_id, service_id, and date are required' });
  }
  try {
    const serviceResult = await db.query('SELECT duration_minutes FROM services WHERE id = $1', [service_id]);
    const duration = serviceResult.rows[0]?.duration_minutes || 60;

    // Get branch opening hours for the day
    const branchResult = await db.query('SELECT opening_hours FROM branches WHERE id = $1', [branch_id]);
    const openingHours = branchResult.rows[0]?.opening_hours;
    const dayOfWeek = new Date(date).toLocaleDateString('en-NZ', { weekday: 'long' }).toLowerCase();
    const hours = openingHours?.[dayOfWeek] || { open: '09:00', close: '18:00', closed: false };

    if (hours.closed) return res.json({ slots: [], message: 'Branch closed on this day' });

    // Generate time slots
    const slots = [];
    const [openH, openM] = hours.open.split(':').map(Number);
    const [closeH, closeM] = hours.close.split(':').map(Number);
    let current = openH * 60 + openM;
    const end = closeH * 60 + closeM - duration;

    while (current <= end) {
      const hh = String(Math.floor(current / 60)).padStart(2, '0');
      const mm = String(current % 60).padStart(2, '0');
      slots.push(`${hh}:${mm}`);
      current += 30; // 30-min intervals
    }

    // Get existing bookings to exclude
    let bookingQuery = `
      SELECT start_time, end_time, employee_id FROM bookings
      WHERE branch_id = $1 AND DATE(start_time) = $2
      AND status NOT IN ('cancelled', 'no_show')
    `;
    const params = [branch_id, date];

    if (employee_id) {
      bookingQuery += ' AND employee_id = $3';
      params.push(employee_id);
    }

    const bookings = await db.query(bookingQuery, params);
    const bookedSlots = bookings.rows;

    // Filter out booked slots
    const available = slots.filter(slot => {
      const [h, m] = slot.split(':').map(Number);
      const slotStart = h * 60 + m;
      const slotEnd = slotStart + duration;

      return !bookedSlots.some(b => {
        const bStart = new Date(b.start_time);
        const bEnd = new Date(b.end_time);
        const bStartMins = bStart.getHours() * 60 + bStart.getMinutes();
        const bEndMins = bEnd.getHours() * 60 + bEnd.getMinutes();
        return slotStart < bEndMins && slotEnd > bStartMins;
      });
    });

    res.json({ slots: available, duration, date });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/bookings - list (filtered by user role)
router.get('/', authenticate, async (req, res) => {
  const { branch_id, employee_id, date_from, date_to, status, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  try {
    let conditions = [];
    let params = [];
    let idx = 1;

    if (req.user.role_name === 'customer') {
      conditions.push(`b.customer_id = $${idx++}`);
      params.push(req.user.id);
    }
    if (req.user.role_name === 'staff') {
      conditions.push(`b.employee_id = $${idx++}`);
      params.push(req.user.id);
    }
    if (branch_id) { conditions.push(`b.branch_id = $${idx++}`); params.push(branch_id); }
    if (employee_id) { conditions.push(`b.employee_id = $${idx++}`); params.push(employee_id); }
    if (status) { conditions.push(`b.status = $${idx++}`); params.push(status); }
    if (date_from) { conditions.push(`b.start_time >= $${idx++}`); params.push(date_from); }
    if (date_to) { conditions.push(`b.start_time <= $${idx++}`); params.push(date_to + ' 23:59:59'); }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const result = await db.query(`
      SELECT b.*,
        u.first_name || ' ' || u.last_name as customer_name, u.email as customer_email, u.phone as customer_phone,
        e.first_name || ' ' || e.last_name as staff_name, e.image_url as staff_image,
        s.name as service_name, s.duration_minutes, s.price,
        br.name as branch_name
      FROM bookings b
      JOIN users u ON b.customer_id = u.id
      JOIN employees e ON b.employee_id = e.id
      JOIN services s ON b.service_id = s.id
      JOIN branches br ON b.branch_id = br.id
      ${where}
      ORDER BY b.start_time DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `, [...params, limit, offset]);

    const countResult = await db.query(
      `SELECT COUNT(*) FROM bookings b ${where}`,
      params
    );

    res.json({
      bookings: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      pages: Math.ceil(countResult.rows[0].count / limit)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/bookings - create booking
router.post('/', authenticate, async (req, res) => {
  const { branch_id, service_id, start_time, notes, voucher_code } = req.body;
  let { employee_id } = req.body;
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    // Get service details
    const serviceResult = await client.query('SELECT * FROM services WHERE id = $1', [service_id]);
    const service = serviceResult.rows[0];
    if (!service) throw new Error('Service not found');

    const endTime = new Date(new Date(start_time).getTime() + service.duration_minutes * 60000);

    // Auto-assign staff when "any available" was selected
    if (!employee_id) {
      const available = await client.query(`
        SELECT e.id FROM employees e
        JOIN employee_services es ON es.employee_id = e.id
        WHERE e.branch_id = $1 AND es.service_id = $2 AND e.is_active = true
        AND NOT EXISTS (
          SELECT 1 FROM bookings b
          WHERE b.employee_id = e.id
          AND b.status NOT IN ('cancelled','no_show')
          AND ($3 < b.end_time AND $4 > b.start_time)
        )
        LIMIT 1
      `, [branch_id, service_id, start_time, endTime.toISOString()]);
      if (!available.rows[0]) throw new Error('No staff available for this time slot');
      employee_id = available.rows[0].id;
    }

    // Check for conflicts on the assigned employee
    const conflict = await client.query(`
      SELECT id FROM bookings
      WHERE employee_id = $1 AND branch_id = $2
      AND status NOT IN ('cancelled', 'no_show')
      AND ($3 < end_time AND $4 > start_time)
    `, [employee_id, branch_id, start_time, endTime.toISOString()]);

    if (conflict.rows.length > 0) {
      throw new Error('Time slot no longer available');
    }

    let finalPrice = service.price;
    let voucherId = null;

    // Apply voucher if provided
    if (voucher_code) {
      const voucher = await client.query(
        `SELECT * FROM gift_vouchers WHERE code = $1 AND is_redeemed = false AND expires_at > NOW()`,
        [voucher_code]
      );
      if (voucher.rows[0]) {
        voucherId = voucher.rows[0].id;
        finalPrice = Math.max(0, finalPrice - voucher.rows[0].amount);
      }
    }

    // Create booking
    const result = await client.query(`
      INSERT INTO bookings (customer_id, branch_id, employee_id, service_id, start_time, end_time, price, notes, voucher_id, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending') RETURNING *
    `, [req.user.id, branch_id, employee_id, service_id, start_time, endTime.toISOString(), finalPrice, notes, voucherId]);

    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

// PUT /api/bookings/:id/status
router.put('/:id/status', authenticate, async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['confirmed', 'cancelled', 'completed', 'no_show'];
  if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  try {
    const result = await db.query(
      'UPDATE bookings SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *',
      [status, req.params.id]
    );

    // If completed, trigger inventory deduction and loyalty points
    if (status === 'completed') {
      await db.query(`
        UPDATE inventory_items SET quantity = quantity - isr.quantity_used
        FROM inventory_service_requirements isr
        WHERE isr.service_id = (SELECT service_id FROM bookings WHERE id = $1)
        AND inventory_items.id = isr.inventory_item_id
      `, [req.params.id]);

      // Add loyalty points
      const booking = result.rows[0];
      await db.query(`
        INSERT INTO loyalty_points (customer_id, points, description, booking_id)
        VALUES ($1, $2, 'Service completed', $3)
        ON CONFLICT DO NOTHING
      `, [booking.customer_id, Math.floor(booking.price), booking.id]);
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/bookings/:id/reschedule
router.put('/:id/reschedule', authenticate, async (req, res) => {
  const { start_time, employee_id } = req.body;
  try {
    const bookingResult = await db.query(
      `SELECT b.*, s.duration_minutes FROM bookings b JOIN services s ON b.service_id = s.id WHERE b.id = $1`,
      [req.params.id]
    );
    const booking = bookingResult.rows[0];
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const endTime = new Date(new Date(start_time).getTime() + booking.duration_minutes * 60000);

    const result = await db.query(`
      UPDATE bookings SET start_time=$1, end_time=$2, employee_id=COALESCE($3, employee_id), updated_at=NOW()
      WHERE id=$4 RETURNING *
    `, [start_time, endTime.toISOString(), employee_id, req.params.id]);

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/bookings/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT b.*,
        u.first_name || ' ' || u.last_name as customer_name, u.email as customer_email, u.phone as customer_phone,
        e.first_name || ' ' || e.last_name as staff_name, e.image_url as staff_image, e.role as staff_role,
        s.name as service_name, s.duration_minutes, s.price, s.description as service_description,
        br.name as branch_name, br.address as branch_address,
        p.status as payment_status, p.amount as payment_amount, p.payment_method
      FROM bookings b
      JOIN users u ON b.customer_id = u.id
      JOIN employees e ON b.employee_id = e.id
      JOIN services s ON b.service_id = s.id
      JOIN branches br ON b.branch_id = br.id
      LEFT JOIN payments p ON p.booking_id = b.id
      WHERE b.id = $1
    `, [req.params.id]);

    if (!result.rows[0]) return res.status(404).json({ error: 'Booking not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
