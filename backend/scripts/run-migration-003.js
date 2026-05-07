// Run from backend/ directory: node scripts/run-migration-003.js
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  const sql = fs.readFileSync(path.join(__dirname, '../migrations/003_remove_branches.sql'), 'utf8');
  const client = await pool.connect();
  try {
    console.log('Running migration 003: remove branches...');
    await client.query(sql);
    console.log('Done!');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    client.release();
    pool.end();
  }
}

run();
