import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { getActiveParentChild } from '@/lib/parent-helpers'

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

  const rows = await query<{
    id: string
    badge_type: string
    badge_name: string
    badge_description: string | null
    badge_icon_url: string | null
    points_awarded: number
    awarded_at: string
  }>(
    `SELECT id, badge_type, badge_name, badge_description, badge_icon_url, points_awarded, awarded_at
     FROM badges
     WHERE user_id = $1
     ORDER BY awarded_at DESC`,
    [childId]
  )

  return NextResponse.json({ badges: rows })
}
