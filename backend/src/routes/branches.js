const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/branches - public list
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT b.*, 
        COUNT(DISTINCT e.id) as staff_count,
        COUNT(DISTINCT bs.id) as service_count,
        COALESCE(AVG(r.rating), 0) as avg_rating
      FROM branches b
      LEFT JOIN employees e ON e.branch_id = b.id AND e.is_active = true
      LEFT JOIN branch_services bs ON bs.branch_id = b.id
      LEFT JOIN reviews r ON r.branch_id = b.id
      WHERE b.is_active = true
      GROUP BY b.id
      ORDER BY b.name
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/branches/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT b.*,
        json_agg(DISTINCT jsonb_build_object('id', e.id, 'name', e.first_name || ' ' || e.last_name, 'role', e.role, 'image_url', e.image_url, 'rating', e.avg_rating)) FILTER (WHERE e.id IS NOT NULL) as staff,
        COALESCE(AVG(r.rating), 0) as avg_rating,
        COUNT(DISTINCT r.id) as review_count
      FROM branches b
      LEFT JOIN employees e ON e.branch_id = b.id AND e.is_active = true
      LEFT JOIN reviews r ON r.branch_id = b.id
      WHERE b.id = $1
      GROUP BY b.id
    `, [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Branch not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/branches - admin only
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  const { name, address, city, suburb, phone, email, description, latitude, longitude, opening_hours, image_url } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO branches (name, address, city, suburb, phone, email, description, latitude, longitude, opening_hours, image_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [name, address, city, suburb, phone, email, description, latitude, longitude, JSON.stringify(opening_hours), image_url]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/branches/:id
router.put('/:id', authenticate, authorize('admin', 'manager'), async (req, res) => {
  const { name, address, city, suburb, phone, email, description, latitude, longitude, opening_hours, image_url, is_active } = req.body;
  try {
    const result = await db.query(
      `UPDATE branches SET name=$1, address=$2, city=$3, suburb=$4, phone=$5, email=$6,
       description=$7, latitude=$8, longitude=$9, opening_hours=$10, image_url=$11, is_active=$12, updated_at=NOW()
       WHERE id=$13 RETURNING *`,
      [name, address, city, suburb, phone, email, description, latitude, longitude, JSON.stringify(opening_hours), image_url, is_active, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/branches/:id
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    await db.query('UPDATE branches SET is_active = false WHERE id = $1', [req.params.id]);
    res.json({ message: 'Branch deactivated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
