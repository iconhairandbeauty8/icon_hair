const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/services
router.get('/', async (req, res) => {
  const { branch_id, category, employee_id } = req.query;
  try {
    let conditions = ['s.is_active = true'];
    let params = [];
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
    res.status(500).json({ error: err.message });
  }
});

// GET /api/services/categories
router.get('/categories', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT category, COUNT(*) as service_count FROM services
      WHERE is_active = true GROUP BY category ORDER BY category
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/services
router.post('/', authenticate, authorize('admin', 'manager'), async (req, res) => {
  const { name, category, description, price, duration_minutes, image_url, branch_ids } = req.body;
  const client = await db.getClient();
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
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// PUT /api/services/:id
router.put('/:id', authenticate, authorize('admin', 'manager'), async (req, res) => {
  const { name, category, description, price, duration_minutes, image_url, is_active, branch_ids } = req.body;
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const result = await client.query(`
      UPDATE services SET name=$1, category=$2, description=$3, price=$4, duration_minutes=$5,
        image_url=$6, is_active=$7, updated_at=NOW() WHERE id=$8 RETURNING *
    `, [name, category, description, price, duration_minutes, image_url, is_active ?? true, req.params.id]);

    if (!result.rows[0]) return res.status(404).json({ error: 'Service not found' });

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
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;
