import { NextRequest, NextResponse } from 'next/server'
import { getSession, requireRole } from '@/lib/auth'
import { query } from '@/lib/db'

/**
 * GET /api/admin/students
 *
 * Lightweight student directory used by halaqat enrollment pickers on the
 * maqra'a (recitation) side. Admins, student supervisors, and readers can
 * call this when they need to add students to a halaqa.
 */
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (
    !requireRole(session, [
      'admin',
      'student_supervisor',
      'reciter_supervisor',
      'reader',
    ])
  ) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const search = (searchParams.get('search') || '').trim()
  const limit = Math.min(parseInt(searchParams.get('limit') || '200', 10), 500)

  const params: unknown[] = []
  let where = `WHERE role = 'student'`
  if (search) {
    params.push(`%${search}%`)
    where += ` AND (name ILIKE $${params.length} OR email ILIKE $${params.length})`
  }
  params.push(limit)
  const rows = await query<{
    id: string
    name: string
    email: string
    gender: string | null
    avatar_url: string | null
  }>(
    `SELECT id, name, email, gender, avatar_url
     FROM users
     ${where}
     ORDER BY name ASC
     LIMIT $${params.length}`,
    params
  )

  return NextResponse.json({ data: rows })
}
