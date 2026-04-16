import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string, submissionId: string }> }
) {
  const session = await getSession()
  if (!session || !['teacher', 'admin', 'academy_admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const p = await params;
    const { id: taskId, submissionId } = p;
    const body = await req.json()
    const { score, feedback } = body

    // Ownership
    const tCheck = await query(`
      SELECT t.id FROM tasks t JOIN courses c ON t.course_id = c.id 
      WHERE t.id = $1 AND c.teacher_id = $2
    `, [taskId, session.sub])

    if (tCheck.length === 0) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const q = `
      UPDATE task_submissions 
      SET score = $1, feedback = $2, status = 'graded', graded_at = NOW()
      WHERE id = $3 AND task_id = $4
      RETURNING *
    `
    const res = await query(q, [score, feedback, submissionId, taskId])
    
    return NextResponse.json({ success: true, data: res[0] })
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
