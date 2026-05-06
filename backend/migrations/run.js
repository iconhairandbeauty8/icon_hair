/**
 * Migration Runner
 * Runs all .sql files in the migrations directory in order.
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'salon_saas',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function runMigrations() {
  const client = await pool.connect();

  try {
    console.log('🔌 Connected to database:', process.env.DB_NAME || 'salon_saas');

    // Create migrations tracking table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Get list of already applied migrations
    const { rows: applied } = await client.query('SELECT filename FROM _migrations');
    const appliedSet = new Set(applied.map(r => r.filename));

    // Get all SQL files sorted
    const migrationsDir = path.join(__dirname);
    const sqlFiles = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    if (sqlFiles.length === 0) {
      console.log('⚠️  No SQL migration files found.');
      return;
    }

    let ran = 0;
    for (const file of sqlFiles) {
      if (appliedSet.has(file)) {
        console.log(`⏭️  Skipping (already applied): ${file}`);
        continue;
      }

      console.log(`\n▶️  Running migration: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO _migrations (filename) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`✅ Applied: ${file}`);
        ran++;
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`❌ Failed on: ${file}`);
        console.error(err.message);
        process.exit(1);
      }
    }

    if (ran === 0) {
      console.log('\n✅ All migrations already up to date.');
    } else {
      console.log(`\n🎉 Successfully applied ${ran} migration(s).`);
    }

    // Show current table count
    const { rows: tables } = await client.query(`
      SELECT COUNT(*) as count FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `);
    console.log(`📊 Total tables in database: ${tables[0].count}`);

  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch(err => {
  console.error('💥 Migration runner error:', err.message);
  process.exit(1);
});
