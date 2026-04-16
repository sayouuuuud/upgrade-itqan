import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

// POST: Search for student by email OR link a child
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'parent') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  const body = await req.json()
  const { action, email, child_id, relation } = body

  // Action 1: Search for a student
  if (action === 'search') {
    if (!email) {
      return NextResponse.json({ error: 'البريد الإلكتروني مطلوب' }, { status: 400 })
    }

    const student = await queryOne<{
      id: string
      name: string
      email: string
      avatar_url: string | null
      role: string
    }>(
      `SELECT id, name, email, avatar_url, role FROM users WHERE email = $1 AND role = 'student' LIMIT 1`,
      [email.toLowerCase()]
    )

    if (!student) {
      return NextResponse.json({ error: 'لم يتم العثور على طالب بهذا البريد الإلكتروني' }, { status: 404 })
    }

    // Check if already linked
    const existing = await queryOne<{ id: string }>(
      `SELECT id FROM parent_children WHERE parent_id = $1 AND child_id = $2`,
      [session.sub, student.id]
    )

    if (existing) {
      return NextResponse.json({ error: 'هذا الطالب مربوط بحسابك بالفعل' }, { status: 409 })
    }

    return NextResponse.json({ student: { id: student.id, name: student.name, email: student.email, avatar_url: student.avatar_url } })
  }

  // Action 2: Link a child
  if (action === 'link') {
    if (!child_id || !relation) {
      return NextResponse.json({ error: 'معرف الطالب ونوع العلاقة مطلوبان' }, { status: 400 })
    }

    // Verify student exists
    const student = await queryOne<{ id: string; name: string }>(
      `SELECT id, name FROM users WHERE id = $1 AND role = 'student'`,
      [child_id]
    )

    if (!student) {
      return NextResponse.json({ error: 'الطالب غير موجود' }, { status: 404 })
    }

    // Check if already linked
    const existing = await queryOne<{ id: string }>(
      `SELECT id FROM parent_children WHERE parent_id = $1 AND child_id = $2`,
      [session.sub, child_id]
    )

    if (existing) {
      return NextResponse.json({ error: 'هذا الطالب مربوط بحسابك بالفعل' }, { status: 409 })
    }

    // Create link
    const result = await query<{ id: string }>(
      `INSERT INTO parent_children (parent_id, child_id, relation, status)
       VALUES ($1, $2, $3, 'active')
       RETURNING id`,
      [session.sub, child_id, relation]
    )

    if (!result[0]) {
      return NextResponse.json({ error: 'فشل في ربط الحساب' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'تم ربط الطالب بنجاح' })
  }

  return NextResponse.json({ error: 'إجراء غير صالح' }, { status: 400 })
}
