// run-migration-012.js
// تشغيل migration إصلاح role constraint
// node scripts/run-migration-012.js

const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

async function run() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set in .env.local')
    process.exit(1)
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })

  try {
    const sql = fs.readFileSync(path.join(__dirname, '012-fix-role-constraint.sql'), 'utf8')
    
    console.log('🚀 Running migration 012: Fix role CHECK constraint...')
    await pool.query(sql)
    console.log('✅ Migration 012 completed successfully!')
    
    // التحقق من النتيجة
    const result = await pool.query(`
      SELECT constraint_name, check_clause 
      FROM information_schema.check_constraints 
      WHERE constraint_name = 'users_role_check'
    `)
    
    if (result.rows.length > 0) {
      console.log('\n📋 New role constraint:')
      console.log(result.rows[0].check_clause)
    }
    
    // اختبار إدراج مدرس تجريبي
    console.log('\n🧪 Testing teacher INSERT...')
    await pool.query(`
      INSERT INTO users (name, email, password_hash, role, gender, is_active)
      VALUES ('Test Teacher Migration', 'test.migration.teacher@test.com', '$2b$10$test', 'teacher', 'male', true)
      ON CONFLICT (email) DO NOTHING
    `)
    
    const testUser = await pool.query(`SELECT id, name, role FROM users WHERE email = 'test.migration.teacher@test.com'`)
    if (testUser.rows.length > 0) {
      console.log('✅ Teacher role INSERT works!', testUser.rows[0])
      // حذف المستخدم التجريبي
      await pool.query(`DELETE FROM users WHERE email = 'test.migration.teacher@test.com'`)
      console.log('🧹 Test user cleaned up')
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

run()
