// test-teacher-login.js - اختبار تسجيل دخول المدرس
require('dotenv').config({ path: '.env.local' })
const { Pool } = require('pg')
const bcrypt = require('bcryptjs')

async function test() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })
  try {
    // اختبار جلب مستخدم وتحقق الباسورد
    const testEmail = 's@s.s'
    const testPassword = '123456'

    console.log(`\n🔍 Testing login for: ${testEmail}`)
    
    const rows = await pool.query(
      'SELECT id, name, email, password_hash, role, is_active, is_locked FROM users WHERE email = $1',
      [testEmail.toLowerCase()]
    )
    
    if (rows.rows.length === 0) {
      console.log('❌ User not found')
      return
    }
    
    const user = rows.rows[0]
    console.log('✅ User found:', { id: user.id, name: user.name, role: user.role })
    console.log('   password_hash stored:', user.password_hash?.substring(0, 20) + '...')
    console.log('   is_active:', user.is_active)
    console.log('   is_locked:', user.is_locked)
    
    // اختبار الباسورد
    const valid = await bcrypt.compare(testPassword, user.password_hash)
    console.log(`\n🔐 bcrypt.compare('${testPassword}', hash):`, valid ? '✅ VALID' : '❌ INVALID')
    
    if (!valid) {
      console.log('\n💡 Fixing: Updating password to 123456...')
      const hash = await bcrypt.hash('123456', 10)
      await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2', [hash, testEmail.toLowerCase()])
      console.log('✅ Password updated! Try login again.')
    }
    
  } catch (e) {
    console.error('Error:', e.message)
  } finally {
    await pool.end()
  }
}
test()
