import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getActiveParentChild } from '@/lib/parent-helpers'
import { sendWeeklyReport, lastFullWeekRange } from '@/lib/parent-weekly-report'

// POST: parent triggers a weekly report email for a child manually
export async function POST(
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

  // Force re-send by deleting any existing record for this week first
  const range = lastFullWeekRange()
  const result = await sendWeeklyReport({
    parentId: session.sub,
    childId,
    parentChildId: link.id,
    range,
  })

  return NextResponse.json({
    ok: result.ok,
    error: result.error,
    week_start: result.week_start,
    summary: result.summary,
  })
}
