import pg from 'pg'
import bcrypt from 'bcryptjs'
const c = new pg.Client({ connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL })
await c.connect()
const { rows } = await c.query("SELECT email, password_hash, is_active, is_locked FROM users WHERE email IN ('reviewer@test.com','yasser@test.com')")
for (const u of rows) {
  const p123456 = await bcrypt.compare('123456', u.password_hash)
  const ppass123 = await bcrypt.compare('password123', u.password_hash)
  console.log(u.email, '| active:', u.is_active, '| locked:', u.is_locked, "| 123456:", p123456, "| password123:", ppass123)
}
await c.end()
