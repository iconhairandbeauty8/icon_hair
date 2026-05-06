const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');

router.get('/', async (req, res) => {
  const { branch_id, employee_id, limit = 20 } = req.query;
  try {
    let conditions = ['r.is_visible = true'];
    let params = [];
    if (branch_id) { conditions.push(`r.branch_id = $${params.length+1}`); params.push(branch_id); }
    if (employee_id) { conditions.push(`r.employee_id = $${params.length+1}`); params.push(employee_id); }
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
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticate, async (req, res) => {
  const { booking_id, rating, comment, employee_id, service_id, branch_id } = req.body;
  try {
    const existing = await db.query('SELECT id FROM reviews WHERE booking_id = $1', [booking_id]);
    if (existing.rows[0]) return res.status(409).json({ error: 'Review already submitted' });
    const result = await db.query(`
      INSERT INTO reviews (booking_id, customer_id, employee_id, service_id, branch_id, rating, comment)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *
    `, [booking_id, req.user.id, employee_id, service_id, branch_id, rating, comment]);

    // Update employee avg rating
    await db.query(`
      UPDATE employees SET avg_rating = (
        SELECT AVG(rating) FROM reviews WHERE employee_id = $1
      ) WHERE id = $1
    `, [employee_id]);

    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
