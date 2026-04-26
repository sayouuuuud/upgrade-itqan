// reset-all-teacher-passwords.js - إعادة ضبط باسورد كل المدرسين إلى 123456
require('dotenv').config({ path: '.env.local' })
const { Pool } = require('pg')
const bcrypt = require('bcryptjs')

async function reset() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })
  try {
    const hash = await bcrypt.hash('123456', 10)
    const result = await pool.query(
      `UPDATE users SET password_hash = $1, failed_login_count = 0, is_locked = false 
       WHERE role = 'teacher'`,
      [hash]
    )
    console.log('✅ Reset passwords for', result.rowCount, 'teachers to "123456"')
    console.log('🔐 Note: This is a test fix. In production, each teacher should have their own password.')
  } catch (e) {
    console.error('Error:', e.message)
  } finally {
    await pool.end()
  }
}
reset()
