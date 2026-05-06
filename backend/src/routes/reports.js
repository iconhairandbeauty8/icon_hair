const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/reports/revenue
router.get('/revenue', authenticate, authorize('admin', 'manager'), async (req, res) => {
  const { branch_id, period = 'monthly', date_from, date_to } = req.query;

  try {
    let groupBy, dateFormat;
    switch (period) {
      case 'daily':   groupBy = "DATE(b.start_time)"; dateFormat = 'YYYY-MM-DD'; break;
      case 'weekly':  groupBy = "DATE_TRUNC('week', b.start_time)"; dateFormat = 'IYYY-IW'; break;
      case 'monthly': groupBy = "DATE_TRUNC('month', b.start_time)"; dateFormat = 'YYYY-MM'; break;
      default:        groupBy = "DATE_TRUNC('month', b.start_time)";
    }

    const params = [];
    let conditions = ["b.status = 'completed'"];
    let idx = 1;

    if (branch_id) { conditions.push(`b.branch_id = $${idx++}`); params.push(branch_id); }
    if (date_from) { conditions.push(`b.start_time >= $${idx++}`); params.push(date_from); }
    if (date_to)   { conditions.push(`b.start_time <= $${idx++}`); params.push(date_to + ' 23:59:59'); }

    const result = await db.query(`
      SELECT
        ${groupBy} as period,
        COUNT(*) as total_bookings,
        SUM(b.price) as total_revenue,
        AVG(b.price) as avg_booking_value,
        COUNT(DISTINCT b.customer_id) as unique_customers,
        SUM(CASE WHEN b.is_new_customer THEN 1 ELSE 0 END) as new_customers
      FROM bookings b
      WHERE ${conditions.join(' AND ')}
      GROUP BY ${groupBy}
      ORDER BY period
    `, params);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/staff-performance
router.get('/staff-performance', authenticate, authorize('admin', 'manager'), async (req, res) => {
  const { branch_id, date_from, date_to } = req.query;

  try {
    const params = [];
    let conditions = ["b.status = 'completed'"];
    let idx = 1;

    if (branch_id) { conditions.push(`b.branch_id = $${idx++}`); params.push(branch_id); }
    if (date_from) { conditions.push(`b.start_time >= $${idx++}`); params.push(date_from); }
    if (date_to)   { conditions.push(`b.start_time <= $${idx++}`); params.push(date_to); }

    const result = await db.query(`
      SELECT
        e.id,
        e.first_name || ' ' || e.last_name as staff_name,
        e.role,
        e.image_url,
        COUNT(b.id) as total_bookings,
        SUM(b.price) as total_revenue,
        AVG(b.price) as avg_booking_value,
        AVG(r.rating) as avg_rating,
        COUNT(r.id) as total_reviews,
        SUM(s.duration_minutes) as total_service_minutes,
        COUNT(CASE WHEN b.status = 'no_show' THEN 1 END) as no_shows
      FROM employees e
      LEFT JOIN bookings b ON b.employee_id = e.id AND ${conditions.join(' AND ')}
      LEFT JOIN services s ON b.service_id = s.id
      LEFT JOIN reviews r ON r.employee_id = e.id
      ${branch_id ? 'WHERE e.branch_id = $1' : ''}
      GROUP BY e.id
      ORDER BY total_revenue DESC NULLS LAST
    `, params);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/services-analysis
router.get('/services-analysis', authenticate, authorize('admin', 'manager'), async (req, res) => {
  const { branch_id, date_from, date_to } = req.query;

  try {
    const result = await db.query(`
      SELECT
        s.id,
        s.name,
        s.category,
        s.price,
        s.duration_minutes,
        COUNT(b.id) as booking_count,
        SUM(b.price) as total_revenue,
        AVG(r.rating) as avg_rating
      FROM services s
      LEFT JOIN bookings b ON b.service_id = s.id AND b.status = 'completed'
        ${date_from ? `AND b.start_time >= '${date_from}'` : ''}
        ${date_to ? `AND b.start_time <= '${date_to}'` : ''}
        ${branch_id ? `AND b.branch_id = '${branch_id}'` : ''}
      LEFT JOIN reviews r ON r.service_id = s.id
      GROUP BY s.id
      ORDER BY booking_count DESC
    `);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/customer-analytics
router.get('/customer-analytics', authenticate, authorize('admin', 'manager'), async (req, res) => {
  const { branch_id } = req.query;

  try {
    const result = await db.query(`
      SELECT
        u.id,
        u.first_name || ' ' || u.last_name as name,
        u.email,
        u.phone,
        COUNT(b.id) as total_visits,
        SUM(b.price) as total_spent,
        AVG(b.price) as avg_spend,
        MAX(b.start_time) as last_visit,
        MIN(b.start_time) as first_visit,
        lp.membership_tier,
        SUM(pts.points) as loyalty_points
      FROM users u
      JOIN bookings b ON b.customer_id = u.id AND b.status = 'completed'
      LEFT JOIN loyalty_profiles lp ON lp.customer_id = u.id
      LEFT JOIN loyalty_points pts ON pts.customer_id = u.id
      WHERE u.role_id = (SELECT id FROM roles WHERE name = 'customer')
      ${branch_id ? `AND b.branch_id = '${branch_id}'` : ''}
      GROUP BY u.id, lp.membership_tier
      ORDER BY total_spent DESC
    `);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/branch-comparison
router.get('/branch-comparison', authenticate, authorize('admin'), async (req, res) => {
  const { date_from, date_to } = req.query;

  try {
    const result = await db.query(`
      SELECT
        br.id,
        br.name,
        br.city,
        COUNT(DISTINCT b.id) as total_bookings,
        SUM(CASE WHEN b.status = 'completed' THEN b.price ELSE 0 END) as total_revenue,
        COUNT(DISTINCT b.customer_id) as unique_customers,
        COUNT(DISTINCT e.id) as staff_count,
        AVG(r.rating) as avg_rating,
        COUNT(CASE WHEN b.status = 'no_show' THEN 1 END) as no_shows
      FROM branches br
      LEFT JOIN bookings b ON b.branch_id = br.id
        ${date_from ? `AND b.start_time >= '${date_from}'` : ''}
        ${date_to ? `AND b.start_time <= '${date_to}'` : ''}
      LEFT JOIN employees e ON e.branch_id = br.id AND e.is_active = true
      LEFT JOIN reviews r ON r.branch_id = br.id
      WHERE br.is_active = true
      GROUP BY br.id
      ORDER BY total_revenue DESC
    `);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/dashboard-summary
router.get('/dashboard-summary', authenticate, authorize('admin', 'manager'), async (req, res) => {
  const { branch_id } = req.query;
  const today = new Date().toISOString().split('T')[0];
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  try {
    const branchCondition = branch_id ? `AND branch_id = '${branch_id}'` : '';

    const [todayStats, monthStats, pendingBookings, lowStockItems] = await Promise.all([
      db.query(`
        SELECT COUNT(*) as bookings, COALESCE(SUM(price), 0) as revenue
        FROM bookings WHERE DATE(start_time) = $1 AND status = 'completed' ${branchCondition}
      `, [today]),
      db.query(`
        SELECT COUNT(*) as bookings, COALESCE(SUM(price), 0) as revenue
        FROM bookings WHERE start_time >= $1 AND status = 'completed' ${branchCondition}
      `, [monthStart]),
      db.query(`
        SELECT COUNT(*) as count FROM bookings WHERE status = 'pending' ${branchCondition}
      `),
      db.query(`
        SELECT COUNT(*) as count FROM inventory_items
        WHERE quantity <= reorder_point ${branch_id ? `AND branch_id = '${branch_id}'` : ''}
      `),
    ]);

    res.json({
      today: todayStats.rows[0],
      month: monthStats.rows[0],
      pending_bookings: pendingBookings.rows[0].count,
      low_stock_alerts: lowStockItems.rows[0].count,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
