import express, { Request, Response } from 'express';
import db from '../config/database';
import { authenticate, authorize } from '../middleware/auth';
import { PoolClient } from 'pg';

const router = express.Router();

router.get('/alerts', authenticate, authorize('admin', 'manager'), async (_req: Request, res: Response) => {
  try {
    const result = await db.query(`
      SELECT i.*, s.name as supplier_name, s.contact_email
      FROM inventory_items i
      LEFT JOIN suppliers s ON i.supplier_id = s.id
      WHERE i.quantity <= i.reorder_point
      ORDER BY (i.quantity::float / NULLIF(i.reorder_point, 0)) ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/transactions', authenticate, authorize('admin', 'manager'), async (req: Request, res: Response) => {
  const item_id = req.query.item_id as string | undefined;
  const date_from = req.query.date_from as string | undefined;
  const date_to = req.query.date_to as string | undefined;
  try {
    const result = await db.query(`
      SELECT it.*, i.name as item_name, u.first_name || ' ' || u.last_name as adjusted_by_name
      FROM inventory_transactions it
      JOIN inventory_items i ON it.item_id = i.id
      LEFT JOIN users u ON it.adjusted_by = u.id
      WHERE ($1::uuid IS NULL OR it.item_id = $1)
      AND ($2::date IS NULL OR it.created_at >= $2)
      AND ($3::date IS NULL OR it.created_at <= $3)
      ORDER BY it.created_at DESC
      LIMIT 100
    `, [item_id || null, date_from || null, date_to || null]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/', authenticate, authorize('admin', 'manager', 'staff'), async (req: Request, res: Response) => {
  const low_stock = req.query.low_stock as string | undefined;
  try {
    const conditions: string[] = [];
    const params: unknown[] = [];
    if (low_stock === 'true') { conditions.push('i.quantity <= i.reorder_point'); }

    const result = await db.query(`
      SELECT i.*, s.name as supplier_name, s.contact_email as supplier_email
      FROM inventory_items i
      LEFT JOIN suppliers s ON i.supplier_id = s.id
      ${conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''}
      ORDER BY i.quantity <= i.reorder_point DESC, i.name
    `, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/', authenticate, authorize('admin', 'manager'), async (req: Request, res: Response) => {
  const { name, sku, category, quantity, unit, cost_price, retail_price, reorder_point, supplier_id, image_url } = req.body;
  try {
    const result = await db.query(`
      INSERT INTO inventory_items (name, sku, category, quantity, unit, cost_price, retail_price, reorder_point, supplier_id, image_url)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *
    `, [name, sku, category, quantity, unit, cost_price, retail_price, reorder_point, supplier_id, image_url]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.put('/:id/adjust', authenticate, authorize('admin', 'manager', 'staff'), async (req: Request, res: Response) => {
  const { adjustment, reason } = req.body as { adjustment: number; reason: string };
  const client: PoolClient = await db.getClient();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      'UPDATE inventory_items SET quantity = quantity + $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [adjustment, req.params.id]
    );

    await client.query(`
      INSERT INTO inventory_transactions (item_id, adjustment, reason, adjusted_by)
      VALUES ($1, $2, $3, $4)
    `, [req.params.id, adjustment, reason, req.user!.id]);

    await client.query('COMMIT');

    const item = result.rows[0];
    if (item.quantity <= item.reorder_point) {
      console.log(`⚠️ Low stock alert: ${item.name} (${item.quantity} ${item.unit} remaining)`);
    }

    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: (err as Error).message });
  } finally {
    client.release();
  }
});

export default router;
