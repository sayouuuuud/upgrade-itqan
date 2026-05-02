const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.lrrhqjvgippgrlcozrvr:Sayed8820066@aws-1-eu-west-3.pooler.supabase.com:6543/postgres' });
client.connect().then(() => client.query("SELECT pg_get_constraintdef((SELECT oid FROM pg_constraint WHERE conname = 'invitations_status_check'));")).then(res => {
  console.log(res.rows[0].pg_get_constraintdef);
  client.end();
}).catch(console.error);
