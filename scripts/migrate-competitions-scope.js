const { Pool } = require('pg')
const dns = require('dns')

dns.setDefaultResultOrder('ipv4first')

require('dotenv').config({ path: '.env.local' })

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

async function run() {
  try {
    await pool.query(`ALTER TABLE competitions ADD COLUMN IF NOT EXISTS scope TEXT DEFAULT 'academy' CHECK (scope IN ('academy', 'library'))`)
    console.log('✅ Added scope column to competitions')
    
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_competitions_scope ON competitions(scope)`)
    console.log('✅ Created index on scope column')
    
    await pool.query(`UPDATE competitions SET scope = 'academy' WHERE scope IS NULL`)
    console.log('✅ Updated existing rows to scope=academy')
    
    console.log('\n🎉 Migration completed successfully!')
  } catch(e) {
    if (e.code === '42701') {
      console.log('✅ Column scope already exists - skipping')
    } else {
      console.error('❌ Migration error:', e.message)
    }
  }
  await pool.end()
  process.exit(0)
}

run()
