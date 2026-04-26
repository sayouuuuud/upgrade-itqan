// check-all-teachers.js - فحص كل المدرسين وباسورداتهم
require('dotenv').config({ path: '.env.local' })
const { Pool } = require('pg')
const bcrypt = require('bcryptjs')

async function check() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })
  try {
    const rows = await pool.query(
      `SELECT id, name, email, password_hash, role, is_active, is_locked, has_academy_access 
       FROM users WHERE role = 'teacher' ORDER BY created_at`
    )
    
    console.log(`\n📋 Found ${rows.rows.length} teachers:\n`)
    
    for (const user of rows.rows) {
      const testPass = '123456'
      const valid = await bcrypt.compare(testPass, user.password_hash)
      console.log(`👤 ${user.name} (${user.email})`)
      console.log(`   role: ${user.role} | active: ${user.is_active} | locked: ${user.is_locked} | academy_access: ${user.has_academy_access}`)
      console.log(`   password '123456' works: ${valid ? '✅ YES' : '❌ NO'}`)
      console.log()
    }
    
  } catch (e) {
    console.error('Error:', e.message)
  } finally {
    await pool.end()
  }
}
check()
