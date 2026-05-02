import { Pool } from 'pg';
const pool = new Pool({
  connectionString: 'postgresql://postgres.lrrhqjvgippgrlcozrvr:Sayed8820066@aws-1-eu-west-3.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const columns = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'courses'");
    console.log('Courses Columns:', columns.rows);
    
    const sample = await pool.query("SELECT * FROM courses LIMIT 1");
    console.log('Sample Course:', sample.rows);
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}
run();
