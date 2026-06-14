import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

const VALID_RELATIONS = ['father', 'mother', 'guardian', 'other']

// PATCH: update the relation label for a linked child (params id = child_id)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || session.role !== 'parent') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  const { id: childId } = await params
  const body = await req.json().catch(() => null)
  const relation = body?.relation

  if (!relation || !VALID_RELATIONS.includes(relation)) {
    return NextResponse.json({ error: 'صلة القرابة غير صالحة' }, { status: 400 })
  }

  const link = await queryOne<{ id: string }>(
    `SELECT id FROM parent_children WHERE parent_id = $1 AND child_id = $2`,
    [session.sub, childId]
  )

  if (!link) {
    return NextResponse.json({ error: 'الربط غير موجود' }, { status: 404 })
  }

  await query(
    `UPDATE parent_children SET relation = $1, updated_at = NOW()
     WHERE parent_id = $2 AND child_id = $3`,
    [relation, session.sub, childId]
  )

  return NextResponse.json({ success: true, relation })
}

// DELETE: unlink a child (parent_children row id)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || session.role !== 'parent') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  const { id } = await params

  const link = await queryOne<{ id: string; parent_id: string }>(
    `SELECT id, parent_id FROM parent_children WHERE id = $1`,
    [id]
  )

  if (!link || link.parent_id !== session.sub) {
    return NextResponse.json({ error: 'غير موجود' }, { status: 404 })
  }

  await query(
    `UPDATE parent_children
     SET status = 'removed', updated_at = NOW()
     WHERE id = $1`,
    [id]
  )

  return NextResponse.json({ success: true })
}
