import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

/**
 * GET /api/academy/parent/children
 *
 * Returns the parent's linked children. By default only `active` links are
 * returned (i.e. children who approved the link). Pass `?status=all` or a
 * specific status (`pending|rejected|inactive`) to get other states.
 */
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'parent') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const statusFilter = (searchParams.get('status') || 'active').toLowerCase()

  let whereStatus = `pc.status = 'active'`
  const params: any[] = [session.sub]
  if (statusFilter === 'all') {
    whereStatus = `TRUE`
  } else if (['pending', 'rejected', 'inactive'].includes(statusFilter)) {
    whereStatus = `pc.status = $2`
    params.push(statusFilter)
  }

  const children = await query<{
    id: string
    child_id: string
    child_name: string
    child_email: string
    child_avatar: string | null
    relation: string
    status: string
    linked_at: string
  }>(
    `SELECT pc.id, pc.child_id,
            u.name        AS child_name,
            u.email       AS child_email,
            u.avatar_url  AS child_avatar,
            pc.relation, pc.status,
            pc.created_at AS linked_at
     FROM parent_children pc
     JOIN users u ON u.id = pc.child_id
     WHERE pc.parent_id = $1 AND ${whereStatus}
     ORDER BY pc.created_at DESC`,
    params
  )

  // Counts so the dashboard can show pending/rejected at a glance
  const counts = await query<{ status: string; count: string }>(
    `SELECT status, COUNT(*)::text AS count
     FROM parent_children
     WHERE parent_id = $1
     GROUP BY status`,
    [session.sub]
  )
  const summary = {
    active: 0,
    pending: 0,
    rejected: 0,
    inactive: 0,
  } as Record<string, number>
  for (const row of counts) {
    summary[row.status] = Number(row.count)
  }

  return NextResponse.json({ children, summary })
}

/**
 * DELETE /api/academy/parent/children
 * Unlink a child from the parent's account
 * body { child_id }
 */
export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'parent') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  const body = await req.json()
  const { child_id } = body

  if (!child_id) {
    return NextResponse.json({ error: 'معرف الابن مطلوب' }, { status: 400 })
  }

  // Verify the link exists
  const link = await query<{ id: string }>(
    `SELECT id FROM parent_children WHERE parent_id = $1 AND child_id = $2`,
    [session.sub, child_id]
  )

  if (link.length === 0) {
    return NextResponse.json({ error: 'الربط غير موجود' }, { status: 404 })
  }

  // Delete the link
  await query(
    `DELETE FROM parent_children WHERE parent_id = $1 AND child_id = $2`,
    [session.sub, child_id]
  )

  return NextResponse.json({ success: true, message: 'تم إلغاء ربط الابن بنجاح' })
}
