require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query("SELECT * FROM parent_children LIMIT 5").then(res => {
  console.log(res.rows);
  pool.end();
}).catch(err => {
  console.error(err);
  pool.end();
});
