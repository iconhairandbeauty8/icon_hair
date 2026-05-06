const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

// LOYALTY
router.get('/profile', authenticate, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT lp.*, COALESCE(SUM(pts.points), 0) as total_points
      FROM loyalty_profiles lp
      LEFT JOIN loyalty_points pts ON pts.customer_id = lp.customer_id
      WHERE lp.customer_id = $1
      GROUP BY lp.id
    `, [req.user.id]);
    res.json(result.rows[0] || { membership_tier: 'standard', total_points: 0 });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/customers', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const result = await db.query(`
      SELECT u.id, u.first_name, u.last_name, u.email, u.phone,
        lp.membership_tier, COALESCE(SUM(pts.points), 0) as total_points,
        COUNT(DISTINCT b.id) as total_bookings
      FROM users u
      JOIN loyalty_profiles lp ON lp.customer_id = u.id
      LEFT JOIN loyalty_points pts ON pts.customer_id = u.id
      LEFT JOIN bookings b ON b.customer_id = u.id AND b.status = 'completed'
      GROUP BY u.id, lp.membership_tier
      ORDER BY total_points DESC
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
