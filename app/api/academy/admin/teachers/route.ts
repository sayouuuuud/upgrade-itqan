import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || !['academy_admin', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const rows = await query(`
      SELECT 
        u.*,
        COUNT(DISTINCT c.id)::int as courses_count,
        COUNT(DISTINCT e.student_id)::int as total_students
      FROM users u
      LEFT JOIN courses c ON u.id = c.teacher_id
      LEFT JOIN enrollments e ON c.id = e.course_id AND e.status = 'active'
      WHERE u.role = 'teacher'
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `)
    return NextResponse.json({ data: rows })
  } catch (error) {
    console.error('Error fetching teachers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || !['academy_admin', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { name, email, password, gender } = await req.json()
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 })
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const password_hash = await bcrypt.hash(password, salt)

    // Create user with teacher role
    const result = await query(`
      INSERT INTO users (name, email, password_hash, role, gender, is_active, created_at)
      VALUES ($1, $2, $3, 'teacher', $4, true, NOW())
      RETURNING *
    `, [name, email, password_hash, gender || 'male'])

    return NextResponse.json({ data: result[0] }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating teacher:', error)
    if (error.code === '23505') {
      return NextResponse.json({ error: 'البريد الإلكتروني مستخدم بالفعل' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
