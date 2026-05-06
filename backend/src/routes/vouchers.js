const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');

router.get('/validate/:code', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM gift_vouchers WHERE code = $1 AND is_redeemed = false AND (expires_at IS NULL OR expires_at > NOW())',
      [req.params.code]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Invalid or expired voucher' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/my-vouchers', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM gift_vouchers WHERE purchaser_id = $1 OR recipient_email = $2 ORDER BY created_at DESC',
      [req.user.id, req.user.email]
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
