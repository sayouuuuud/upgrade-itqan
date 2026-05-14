import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import { getActiveParentChild } from '@/lib/parent-helpers'

// GET: list current restrictions for this parent-child link
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
    is_blocked: boolean
    created_at: string
  }>(
    `SELECT id, restriction_type, target_id, is_blocked, created_at
     FROM parent_content_restrictions
     WHERE parent_child_id = $1
     ORDER BY restriction_type, target_id`,
    [link.id]
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

  return NextResponse.json({
    restrictions,
    paths: {
      memorization: memorizationPaths,
      tajweed: tajweedPaths,
    },
  })
}

// POST: toggle a restriction { restriction_type, target_id, is_blocked }
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
  const { restriction_type, target_id, is_blocked } = body

  if (
    !restriction_type ||
    !target_id ||
    !['surah', 'memorization_path', 'tajweed_path'].includes(restriction_type)
  ) {
    return NextResponse.json({ error: 'بيانات ناقصة أو غير صالحة' }, { status: 400 })
  }

  if (is_blocked === false) {
    // Remove the restriction (unblock)
    await query(
      `DELETE FROM parent_content_restrictions
       WHERE parent_child_id = $1 AND restriction_type = $2 AND target_id = $3`,
      [link.id, restriction_type, target_id.toString()]
    )
    return NextResponse.json({ success: true, removed: true })
  }

  // Block (insert/update)
  const inserted = await queryOne<{ id: string }>(
    `INSERT INTO parent_content_restrictions
       (parent_child_id, restriction_type, target_id, is_blocked)
     VALUES ($1, $2, $3, true)
     ON CONFLICT (parent_child_id, restriction_type, target_id)
     DO UPDATE SET is_blocked = true, updated_at = NOW()
     RETURNING id`,
    [link.id, restriction_type, target_id.toString()]
  )

  return NextResponse.json({ success: true, id: inserted?.id })
}
