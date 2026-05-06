const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize('admin', 'manager'), async (req, res) => {
  const { branch_id } = req.query;
  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const bc = branch_id ? `AND branch_id = '${branch_id}'` : '';

  try {
    const [
      todayBookings, upcomingToday, monthRevenue, totalCustomers,
      recentBookings, topServices, staffOnDuty, lowStock
    ] = await Promise.all([
      db.query(`SELECT COUNT(*) as count, COALESCE(SUM(price),0) as revenue FROM bookings WHERE DATE(start_time)=$1 AND status IN ('confirmed','completed') ${bc}`, [today]),
      db.query(`SELECT COUNT(*) as count FROM bookings WHERE DATE(start_time)=$1 AND status='confirmed' ${bc}`, [today]),
      db.query(`SELECT COALESCE(SUM(price),0) as revenue, COUNT(*) as bookings FROM bookings WHERE start_time>=$1 AND status='completed' ${bc}`, [monthStart]),
      db.query(`SELECT COUNT(DISTINCT customer_id) as count FROM bookings ${bc ? 'WHERE ' + bc.slice(4) : ''}`),
      db.query(`
        SELECT b.id, b.start_time, b.status, b.price,
          u.first_name || ' ' || u.last_name as customer,
          s.name as service, e.first_name || ' ' || e.last_name as staff
        FROM bookings b JOIN users u ON b.customer_id=u.id JOIN services s ON b.service_id=s.id JOIN employees e ON b.employee_id=e.id
        WHERE b.start_time >= $1 ${bc} ORDER BY b.start_time LIMIT 10
      `, [today]),
      db.query(`
        SELECT s.name, COUNT(b.id) as bookings, SUM(b.price) as revenue
        FROM services s JOIN bookings b ON b.service_id=s.id
        WHERE b.start_time>=$1 AND b.status='completed' ${bc}
        GROUP BY s.id ORDER BY bookings DESC LIMIT 5
      `, [weekAgo]),
      db.query(`
        SELECT e.id, e.first_name, e.last_name, e.role, e.image_url,
          COUNT(b.id) as today_bookings
        FROM employees e LEFT JOIN bookings b ON b.employee_id=e.id AND DATE(b.start_time)=$1 AND b.status='confirmed'
        WHERE e.is_active=true ${branch_id ? `AND e.branch_id='${branch_id}'` : ''}
        GROUP BY e.id LIMIT 8
      `, [today]),
      db.query(`SELECT COUNT(*) as count FROM inventory_items WHERE quantity<=reorder_point ${branch_id ? `AND branch_id='${branch_id}'` : ''}`),
    ]);

    res.json({
      stats: {
        today_bookings: todayBookings.rows[0],
        upcoming_today: upcomingToday.rows[0].count,
        month: monthRevenue.rows[0],
        total_customers: totalCustomers.rows[0].count,
        low_stock_alerts: lowStock.rows[0].count,
      },
      recent_bookings: recentBookings.rows,
      top_services: topServices.rows,
      staff_on_duty: staffOnDuty.rows,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
