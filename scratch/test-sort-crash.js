const { Pool } = require('pg');

const pool = new Pool({ 
    connectionString: 'postgresql://postgres.lrrhqjvgippgrlcozrvr:Sayed8820066@aws-1-eu-west-3.pooler.supabase.com:6543/postgres' 
});

async function test() {
  try {
    const res = await pool.query(`
      SELECT p.id, p.created_at, p.is_published
      FROM tajweed_paths p
      LIMIT 2
    `);
    const rows = res.rows;
    console.log("Before sorting:", rows);
    
    rows.sort((a, b) => {
      const pa = a.is_published === true ? 0 : 1
      const pb = b.is_published === true ? 0 : 1
      if (pa !== pb) return pa - pb
      const ca = a.created_at || ""
      const cb = b.created_at || ""
      return cb.localeCompare(ca)
    });
    console.log("After sorting:", rows);
  } catch (err) {
    console.error("Caught error:", err.message);
  }
  pool.end();
}

test();
