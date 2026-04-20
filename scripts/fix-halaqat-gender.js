const { Client } = require('pg')
const client = new Client({
  connectionString: 'postgresql://postgres.lrrhqjvgippgrlcozrvr:Sayed8820066@aws-1-eu-west-3.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
})

async function run() {
  await client.connect()
  
  // Check the gender constraint definition
  const res = await client.query(`
    SELECT pg_get_constraintdef(oid) as def 
    FROM pg_constraint 
    WHERE conname = 'halaqat_gender_check'
  `)
  console.log('Current gender constraint:', res.rows[0]?.def)
  
  // Drop old constraint and add new one including 'both'
  try {
    await client.query(`ALTER TABLE halaqat DROP CONSTRAINT IF EXISTS halaqat_gender_check`)
    console.log('✔ Dropped old constraint')
    
    await client.query(`ALTER TABLE halaqat ADD CONSTRAINT halaqat_gender_check CHECK (gender IN ('male', 'female', 'both', 'mixed'))`)
    console.log('✔ Added new constraint with male/female/both/mixed')
  } catch (e) {
    console.log('Error:', e.message)
  }
  
  await client.end()
}

run().catch(console.error)
