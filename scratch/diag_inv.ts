import { Pool } from 'pg';
const pool = new Pool({
  connectionString: 'postgresql://postgres.lrrhqjvgippgrlcozrvr:Sayed8820066@aws-1-eu-west-3.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const columns = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'invitations'");
    console.log('Invitations Columns:', columns.rows);
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}
run();
