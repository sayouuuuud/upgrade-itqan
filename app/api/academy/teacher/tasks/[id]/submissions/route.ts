import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || !['teacher', 'admin', 'academy_admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const taskId = (await params).id;
    
    // Verify task belongs to this teacher
    const qTask = `
      SELECT t.id, t.max_score FROM tasks t
      JOIN courses c ON t.course_id = c.id
      WHERE t.id = $1 AND c.teacher_id = $2
    `
    const tCheck = await query<any>(qTask, [taskId, session.sub])
    if (tCheck.length === 0) {
       return NextResponse.json({ error: 'Forbidden or not found' }, { status: 403 })
    }

    const qSubs = `
      SELECT ts.*, u.name as student_name
      FROM task_submissions ts
      JOIN users u ON ts.student_id = u.id
      WHERE ts.task_id = $1
      ORDER BY ts.submitted_at DESC
    `
    const rows = await query<any>(qSubs, [taskId])
    
    // Add max_score to each row for the frontend
    const mapped = rows.map(r => ({ ...r, max_score: tCheck[0].max_score }))

    return NextResponse.json({ data: mapped })
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
