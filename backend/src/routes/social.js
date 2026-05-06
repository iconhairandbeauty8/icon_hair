// social.js
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT p.*, u.first_name || ' ' || u.last_name as author_name,
        COUNT(DISTINCT pl.id) as like_count,
        json_agg(DISTINCT jsonb_build_object('id', pc.id, 'text', pc.text, 'author', cu.first_name)) FILTER (WHERE pc.id IS NOT NULL) as comments
      FROM social_posts p
      JOIN users u ON p.author_id = u.id
      LEFT JOIN post_likes pl ON pl.post_id = p.id
      LEFT JOIN post_comments pc ON pc.post_id = p.id
      LEFT JOIN users cu ON pc.author_id = cu.id
      WHERE p.is_published = true
      GROUP BY p.id
      ORDER BY p.created_at DESC LIMIT 20
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticate, authorize('admin', 'manager'), async (req, res) => {
  const { title, content, image_urls, type, branch_id, linked_service_id } = req.body;
  try {
    const result = await db.query(`
      INSERT INTO social_posts (author_id, title, content, image_urls, type, branch_id, linked_service_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *
    `, [req.user.id, title, content, JSON.stringify(image_urls || []), type, branch_id, linked_service_id]);
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/like', authenticate, async (req, res) => {
  try {
    const existing = await db.query('SELECT id FROM post_likes WHERE post_id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    if (existing.rows[0]) {
      await db.query('DELETE FROM post_likes WHERE post_id=$1 AND user_id=$2', [req.params.id, req.user.id]);
      return res.json({ liked: false });
    }
    await db.query('INSERT INTO post_likes (post_id, user_id) VALUES ($1,$2)', [req.params.id, req.user.id]);
    res.json({ liked: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
