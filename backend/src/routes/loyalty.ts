import express, { Request, Response } from 'express';
import db from '../config/database';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// ─── Default tier config per criteria ─────────────────────────────────────────
const DEFAULT_TIERS = [
  { key: 'standard', label: 'Standard', icon: '🌿', min_value: 0,    discount: 0  },
  { key: 'silver',   label: 'Silver',   icon: '🥈', min_value: 500,  discount: 5  },
  { key: 'gold',     label: 'Gold',     icon: '🥇', min_value: 1000, discount: 10 },
  { key: 'vip',      label: 'VIP',      icon: '💎', min_value: 2500, discount: 15 },
  { key: 'platinum', label: 'Platinum', icon: '👑', min_value: 5000, discount: 20 },
];

const CRITERIA_DEFAULTS: Record<string, number[]> = {
  points: [0, 500,  1000, 2500, 5000],
  spend:  [0, 200,  500,  1000, 2500],
  visits: [0, 5,    10,   20,   50  ],
};

// Ensure loyalty_settings table exists (lazy init)
async function ensureSettingsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS loyalty_settings (
      id      INT PRIMARY KEY DEFAULT 1,
      criteria VARCHAR(20) NOT NULL DEFAULT 'points',
      tiers   JSONB NOT NULL DEFAULT '[]',
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

// Create loyalty_profiles rows for every customer-role user who doesn't have one yet
async function ensureProfilesExist() {
  await db.query(`
    INSERT INTO loyalty_profiles (customer_id, membership_tier, is_loyalty_member)
    SELECT u.id, 'standard', true
    FROM users u
    JOIN roles r ON r.id = u.role_id AND r.name = 'customer'
    WHERE NOT EXISTS (
      SELECT 1 FROM loyalty_profiles lp WHERE lp.customer_id = u.id
    )
  `);
}

// Recalculate membership_tier for all loyalty_profile rows
async function recalculateTiers(criteria: string, tiers: any[]) {
  // First make sure every customer has a profile row
  await ensureProfilesExist();

  const sorted = [...tiers].sort((a, b) => b.min_value - a.min_value);

  // Build metric subquery — include confirmed + completed bookings for spend/visits
  let metricSql = '';
  if (criteria === 'spend') {
    metricSql = `
      SELECT lp.customer_id,
             COALESCE(SUM(b.price), 0) AS metric_value
      FROM loyalty_profiles lp
      LEFT JOIN bookings b ON b.customer_id = lp.customer_id
        AND b.status IN ('completed', 'confirmed')
      GROUP BY lp.customer_id
    `;
  } else if (criteria === 'visits') {
    metricSql = `
      SELECT lp.customer_id,
             COUNT(b.id) AS metric_value
      FROM loyalty_profiles lp
      LEFT JOIN bookings b ON b.customer_id = lp.customer_id
        AND b.status IN ('completed', 'confirmed')
      GROUP BY lp.customer_id
    `;
  } else {
    // points (default)
    metricSql = `
      SELECT lp.customer_id,
             COALESCE(SUM(pts.points), 0) AS metric_value
      FROM loyalty_profiles lp
      LEFT JOIN loyalty_points pts ON pts.customer_id = lp.customer_id
      GROUP BY lp.customer_id
    `;
  }

  const caseWhen = sorted
    .map(t => `WHEN m.metric_value >= ${Number(t.min_value)} THEN '${t.key}'`)
    .join('\n        ');
  const fallback = sorted[sorted.length - 1]?.key ?? 'standard';

  await db.query(`
    UPDATE loyalty_profiles lp
    SET membership_tier = CASE
        ${caseWhen}
        ELSE '${fallback}'
      END
    FROM (${metricSql}) m
    WHERE lp.customer_id = m.customer_id
  `);
}

// ─── GET /loyalty/profile  (customer) ─────────────────────────────────────────
router.get('/profile', authenticate, async (req: Request, res: Response) => {
  try {
    const result = await db.query(`
      SELECT lp.*, COALESCE(SUM(pts.points), 0) AS total_points
      FROM loyalty_profiles lp
      LEFT JOIN loyalty_points pts ON pts.customer_id = lp.customer_id
      WHERE lp.customer_id = $1
      GROUP BY lp.id
    `, [req.user!.id]);
    res.json(result.rows[0] || { membership_tier: 'standard', total_points: 0 });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ─── GET /loyalty/customers  (admin) ──────────────────────────────────────────
router.get('/customers', authenticate, authorize('admin', 'manager'), async (req: Request, res: Response) => {
  try {
    // Ensure every customer has a profile before returning the list
    await ensureProfilesExist();

    const result = await db.query(`
      SELECT u.id, u.first_name, u.last_name, u.email, u.phone,
        COALESCE(lp.membership_tier, 'standard') AS membership_tier,
        COALESCE(SUM(pts.points), 0)             AS total_points,
        COALESCE(SUM(b_spend.price), 0)          AS total_spend,
        COUNT(DISTINCT b_visits.id)              AS total_visits
      FROM users u
      JOIN roles r ON r.id = u.role_id AND r.name = 'customer'
      LEFT JOIN loyalty_profiles lp   ON lp.customer_id = u.id
      LEFT JOIN loyalty_points pts    ON pts.customer_id = u.id
      LEFT JOIN bookings b_spend  ON b_spend.customer_id  = u.id
        AND b_spend.status  IN ('completed', 'confirmed')
      LEFT JOIN bookings b_visits ON b_visits.customer_id = u.id
        AND b_visits.status IN ('completed', 'confirmed')
      GROUP BY u.id, lp.membership_tier
      ORDER BY total_spend DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ─── GET /loyalty/settings  (admin) ───────────────────────────────────────────
router.get('/settings', authenticate, authorize('admin', 'manager'), async (req: Request, res: Response) => {
  try {
    await ensureSettingsTable();
    const result = await db.query('SELECT * FROM loyalty_settings WHERE id = 1');
    if (!result.rows[0]) {
      return res.json({ criteria: 'points', tiers: DEFAULT_TIERS, criteria_defaults: CRITERIA_DEFAULTS });
    }
    res.json({ ...result.rows[0], criteria_defaults: CRITERIA_DEFAULTS });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ─── PUT /loyalty/settings  (admin) ───────────────────────────────────────────
router.put('/settings', authenticate, authorize('admin', 'manager'), async (req: Request, res: Response) => {
  const { criteria, tiers } = req.body as { criteria: string; tiers: any[] };
  if (!criteria || !Array.isArray(tiers) || tiers.length === 0) {
    res.status(400).json({ error: 'criteria and tiers are required' });
    return;
  }
  try {
    await ensureSettingsTable();

    await db.query(`
      INSERT INTO loyalty_settings (id, criteria, tiers, updated_at)
      VALUES (1, $1, $2, NOW())
      ON CONFLICT (id) DO UPDATE
        SET criteria = EXCLUDED.criteria,
            tiers    = EXCLUDED.tiers,
            updated_at = NOW()
    `, [criteria, JSON.stringify(tiers)]);

    await recalculateTiers(criteria, tiers);

    res.json({ success: true, message: 'Settings saved and customer tiers recalculated.' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
