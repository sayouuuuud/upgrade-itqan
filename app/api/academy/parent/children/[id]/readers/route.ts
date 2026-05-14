import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { getActiveParentChild } from '@/lib/parent-helpers'

// GET: list readers the child has interacted with (assigned recitations or bookings)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || session.role !== 'parent') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  const { id: childId } = await params
  const link = await getActiveParentChild(session.sub, childId)
  if (!link) {
    return NextResponse.json({ error: 'الطالب غير مربوط بحسابك' }, { status: 403 })
  }

  const readers = await query<{
    id: string
    name: string
    email: string
    avatar_url: string | null
  }>(
    `SELECT DISTINCT u.id, u.name, u.email, u.avatar_url
     FROM users u
     WHERE u.role = 'reader'
       AND (
         EXISTS (SELECT 1 FROM recitations r WHERE r.assigned_reader_id = u.id AND r.student_id = $1)
         OR EXISTS (SELECT 1 FROM bookings b WHERE b.reader_id = u.id AND b.student_id = $1)
       )
     ORDER BY u.name`,
    [childId]
  )

  return NextResponse.json({ readers })
}
