require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const res = await pool.query("SELECT * FROM halaqat LIMIT 1");
  console.log(res.rows.length ? Object.keys(res.rows[0]) : 'no rows');
  process.exit(0);
}
run();
