import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

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
