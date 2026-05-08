import express, { Request, Response } from 'express';
import db from '../config/database';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// ─── Shared service_details subquery fragment ────────────────────────────────
const SERVICE_DETAILS_SQL = `
  COALESCE(
    json_agg(json_build_object('id', s.id, 'name', s.name, 'price', s.price, 'duration_minutes', s.duration_minutes))
    FILTER (WHERE s.id IS NOT NULL), '[]'
  ) AS service_details
`;

// ─── GET /promotions/all  (admin — all including inactive) ────────────────────
router.get('/all', authenticate, authorize('admin', 'manager'), async (_req: Request, res: Response) => {
  try {
    const result = await db.query(`
      SELECT p.*, ${SERVICE_DETAILS_SQL}
      FROM promotions p
      LEFT JOIN LATERAL (
        SELECT s.id, s.name, s.price, s.duration_minutes
        FROM services s
        WHERE s.id::text = ANY(
          SELECT jsonb_array_elements_text(p.applicable_services::jsonb)
        )
      ) s ON true
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ─── GET /promotions  (public — active only) ─────────────────────────────────
// No ?date  → Offers page: show ALL active promos (ignore applicable_dates filter)
// ?date=YYYY-MM-DD → Booking flow: only promos valid on that specific date
router.get('/', async (req: Request, res: Response) => {
  const dateParam = (req.query.date as string) || null;
  try {
    // When a date is supplied, filter applicable_dates; otherwise skip that filter
    const result = await db.query(`
      SELECT p.*, ${SERVICE_DETAILS_SQL}
      FROM promotions p
      LEFT JOIN LATERAL (
        SELECT s.id, s.name, s.price, s.duration_minutes
        FROM services s
        WHERE s.id::text = ANY(
          SELECT jsonb_array_elements_text(p.applicable_services::jsonb)
        )
      ) s ON true
      WHERE p.is_active = true
        AND (p.end_date IS NULL OR p.end_date >= NOW())
        AND (
          $1::text IS NULL   -- no date supplied → skip date filter (Offers page)
          OR jsonb_array_length(COALESCE(p.applicable_dates, '[]'::jsonb)) = 0
          OR COALESCE(p.applicable_dates, '[]'::jsonb) @> jsonb_build_array($1::text)
        )
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `, [dateParam]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ─── POST /promotions  (admin) ────────────────────────────────────────────────
router.post('/', authenticate, authorize('admin', 'manager'), async (req: Request, res: Response) => {
  const {
    title, description, type, discount_type, discount_value,
    code, image_url, applicable_services, applicable_dates, is_active,
  } = req.body as {
    title: string; description: string; type: string; discount_type: string;
    discount_value: number; code: string; image_url: string;
    applicable_services: string[]; applicable_dates: string[]; is_active: boolean;
  };

  // Derive start_date / end_date from the selected dates array
  const dates = Array.isArray(applicable_dates) ? applicable_dates.sort() : [];
  const start_date = dates.length > 0 ? dates[0] : null;
  const end_date   = dates.length > 0 ? dates[dates.length - 1] : null;

  try {
    const result = await db.query(`
      INSERT INTO promotions
        (title, description, type, discount_type, discount_value,
         start_date, end_date, code, image_url, applicable_services, applicable_dates, is_active)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *
    `, [
      title, description, type, discount_type, discount_value,
      start_date, end_date, code || null, image_url || null,
      JSON.stringify(applicable_services ?? []),
      JSON.stringify(dates),
      is_active ?? true,
    ]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ─── POST /promotions/validate  (public) ─────────────────────────────────────
router.post('/validate', async (req: Request, res: Response) => {
  const { code, service_id, amount } = req.body as { code: string; service_id: string; amount: number };
  try {
    const result = await db.query(`
      SELECT * FROM promotions WHERE code = $1 AND is_active = true
      AND (start_date IS NULL OR start_date <= NOW())
      AND (end_date IS NULL OR end_date >= NOW())
    `, [code]);
    if (!result.rows[0]) {
      res.status(404).json({ error: 'Invalid or expired promo code' });
      return;
    }
    const promo = result.rows[0];
    const discount = promo.discount_type === 'percentage'
      ? amount * (promo.discount_value / 100)
      : promo.discount_value;
    res.json({ valid: true, promo, discount, final_amount: Math.max(0, amount - discount) });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ─── PUT /promotions/:id  (admin) ─────────────────────────────────────────────
router.put('/:id', authenticate, authorize('admin', 'manager'), async (req: Request, res: Response) => {
  const {
    title, description, type, discount_type, discount_value,
    code, image_url, applicable_services, applicable_dates, is_active,
  } = req.body as {
    title: string; description: string; type: string; discount_type: string;
    discount_value: number; code: string; image_url: string;
    applicable_services: string[]; applicable_dates: string[]; is_active: boolean;
  };

  const dates = Array.isArray(applicable_dates) ? applicable_dates.sort() : [];
  const start_date = dates.length > 0 ? dates[0] : null;
  const end_date   = dates.length > 0 ? dates[dates.length - 1] : null;

  try {
    const result = await db.query(`
      UPDATE promotions
      SET title=$1, description=$2, type=$3, discount_type=$4, discount_value=$5,
          start_date=$6, end_date=$7, code=$8, image_url=$9,
          applicable_services=$10, applicable_dates=$11, is_active=$12, updated_at=NOW()
      WHERE id=$13 RETURNING *
    `, [
      title, description, type, discount_type, discount_value,
      start_date, end_date, code || null, image_url || null,
      JSON.stringify(applicable_services ?? []),
      JSON.stringify(dates),
      is_active ?? true,
      req.params.id,
    ]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
