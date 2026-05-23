const { Pool } = require('pg');

const pool = new Pool({ 
    connectionString: 'postgresql://postgres.lrrhqjvgippgrlcozrvr:Sayed8820066@aws-1-eu-west-3.pooler.supabase.com:6543/postgres' 
});

async function test() {
  try {
    const cols = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'tajweed_paths'
    `);
    const tajweedColumns = new Set(cols.rows.map(c => c.column_name));
    console.log("tajweedColumns:", Array.from(tajweedColumns));

    // Run the select query with WHERE clause
    const subjects = ["fiqh", "aqeedah", "seerah", "tafsir"];
    const res = await pool.query(`
      SELECT p.id, p.title, p.subject, p.is_active, p.is_published
      FROM tajweed_paths p
      WHERE p.is_active = TRUE AND p.subject = ANY($1::text[])
    `, [subjects]);
    console.log("Query returned rows count:", res.rows.length);
    console.log("Rows:", res.rows);
  } catch (err) {
    console.error(err);
  }
  pool.end();
}

test();
