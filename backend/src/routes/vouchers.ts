import express, { Request, Response } from 'express';
import db from '../config/database';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.get('/validate/:code', async (req: Request, res: Response) => {
  try {
    const result = await db.query(
      'SELECT * FROM gift_vouchers WHERE code = $1 AND is_redeemed = false AND (expires_at IS NULL OR expires_at > NOW())',
      [req.params.code]
    );
    if (!result.rows[0]) {
      res.status(404).json({ error: 'Invalid or expired voucher' });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/my-vouchers', authenticate, async (req: Request, res: Response) => {
  try {
    const result = await db.query(
      'SELECT * FROM gift_vouchers WHERE purchaser_id = $1 OR recipient_email = $2 ORDER BY created_at DESC',
      [req.user!.id, req.user!.email]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
