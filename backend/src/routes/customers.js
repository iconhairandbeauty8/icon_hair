const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize('admin', 'manager'), async (req, res) => {
  const { search, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  try {
    let conditions = ["r.name = 'customer'"];
    let params = [];
    if (search) {
      conditions.push(`(u.first_name ILIKE $${params.length+1} OR u.last_name ILIKE $${params.length+1} OR u.email ILIKE $${params.length+1})`);
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
      LIMIT $${params.length-1} OFFSET $${params.length}
    `, params);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
