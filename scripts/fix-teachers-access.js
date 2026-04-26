// fix-teachers-access.js - تحديث has_academy_access للمدرسين الموجودين
require('dotenv').config({ path: '.env.local' })
const { Pool } = require('pg')

async function fix() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })
  try {
    // Update existing teachers
    const r1 = await pool.query(`
      UPDATE users SET has_academy_access = true 
      WHERE role IN ('teacher', 'academy_admin') 
      AND (has_academy_access IS NULL OR has_academy_access = false)
    `)
    console.log('✅ Updated', r1.rowCount, 'existing teacher(s) to has_academy_access = true')

    // Count teachers
    const r2 = await pool.query(`SELECT count(*) as cnt FROM users WHERE role = 'teacher'`)
    console.log('📊 Total teachers in DB:', r2.rows[0].cnt)

    // Show all teachers
    const r3 = await pool.query(`SELECT id, name, email, role, has_academy_access, is_active FROM users WHERE role = 'teacher'`)
    console.log('👨‍🏫 Teachers:', JSON.stringify(r3.rows, null, 2))

  } catch (e) {
    console.error('Error:', e.message)
  } finally {
    await pool.end()
  }
}
fix()
