const { Pool } = require('pg');
const dotenv = require('dotenv');
const dns = require('dns');

dns.setDefaultResultOrder('ipv4first');
dotenv.config({ path: '.env' });

let databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  console.log('No databaseUrl found in .env or .env.local');
  process.exit(1);
}

if (databaseUrl.includes('supabase')) {
  if (/sslmode=[^&]+/.test(databaseUrl)) {
    databaseUrl = databaseUrl.replace(/sslmode=[^&]+/, 'sslmode=no-verify')
  } else {
    databaseUrl = databaseUrl + (databaseUrl.includes('?') ? '&' : '?') + 'sslmode=no-verify'
  }
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false }
});

async function check() {
  const res = await pool.query(`
    SELECT * FROM academy_conversations LIMIT 5;
  `);
  console.log('Academy Conversations:');
  console.log(res.rows);

  const res2 = await pool.query(`
    SELECT * FROM conversations LIMIT 5;
  `);
  console.log('Maqraa Conversations:');
  console.log(res2.rows);

  pool.end();
}

check().catch(console.error);
