import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import { getActiveParentChild } from '@/lib/parent-helpers'

export const dynamic = 'force-dynamic'

// GET: list current restrictions for this parent-child pair
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

  const restrictions = await query<{
    id: string
    restriction_type: string
    target_id: string
    created_at: string
  }>(
    `SELECT id, restriction_type, target_id, created_at
     FROM parent_content_restrictions
     WHERE parent_id = $1 AND child_id = $2
     ORDER BY restriction_type, target_id`,
    [session.sub, childId]
  )

  // Available paths for the parent to choose from
  const memorizationPaths = await query<{ id: string; title: string; level: string | null }>(
    `SELECT id::text, title, level FROM memorization_paths
     WHERE is_published = true AND is_active = true
     ORDER BY title`
  )

  const tajweedPaths = await query<{ id: string; title: string; level: string | null }>(
    `SELECT id::text, title, level FROM tajweed_paths
     WHERE is_published = true AND is_active = true
     ORDER BY title`
  )

  // Available courses the child is enrolled in
  const courses = await query<{ id: string; title: string }>(
    `SELECT c.id::text, c.title
     FROM enrollments e
     JOIN courses c ON c.id = e.course_id
     WHERE e.student_id = $1
     ORDER BY c.title`,
    [childId]
  )

  const child = await queryOne<{ id: string; name: string; avatar_url: string | null }>(
    `SELECT id::text, name, avatar_url FROM users WHERE id = $1`,
    [childId]
  )

  return NextResponse.json({
    child,
    restrictions,
    paths: {
      memorization: memorizationPaths,
      tajweed: tajweedPaths,
    },
    courses,
  })
}

// POST: toggle a restriction { restriction_type, target_id, blocked }
export async function POST(
  req: NextRequest,
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

  const body = await req.json()
  const { restriction_type, target_id, blocked } = body

  if (
    !restriction_type ||
    !target_id ||
    !['course', 'surah', 'feature', 'memorization_path', 'tajweed_path'].includes(restriction_type)
  ) {
    return NextResponse.json({ error: 'بيانات ناقصة أو غير صالحة' }, { status: 400 })
  }

  if (blocked === false || blocked === 0) {
    // Remove the restriction (unblock)
    await query(
      `DELETE FROM parent_content_restrictions
       WHERE parent_id = $1 AND child_id = $2 AND restriction_type = $3 AND target_id = $4`,
      [session.sub, childId, restriction_type, target_id.toString()]
    )
    return NextResponse.json({ success: true, removed: true })
  }

  // Block (insert)
  const inserted = await queryOne<{ id: string }>(
    `INSERT INTO parent_content_restrictions
       (parent_id, child_id, restriction_type, target_id)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (parent_id, child_id, restriction_type, target_id) DO NOTHING
     RETURNING id`,
    [session.sub, childId, restriction_type, target_id.toString()]
  )

  return NextResponse.json({ success: true, id: inserted?.id })
}

// DELETE: remove a specific restriction by id
export async function DELETE(
  req: NextRequest,
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

  const body = await req.json()
  const { restriction_id } = body

  if (!restriction_id) {
    return NextResponse.json({ error: 'معرف التقييد مطلوب' }, { status: 400 })
  }

  await query(
    `DELETE FROM parent_content_restrictions
     WHERE id = $1 AND parent_id = $2 AND child_id = $3`,
    [restriction_id, session.sub, childId]
  )

  return NextResponse.json({ success: true })
}
