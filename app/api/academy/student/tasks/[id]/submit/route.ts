import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const taskId = (await params).id;
    const body = await req.json()
    const { content, file_url } = body

    if (!content && !file_url) {
      return NextResponse.json({ error: 'Content or file required' }, { status: 400 })
    }

    // Check if task exists
    const tc = await query(`SELECT id FROM tasks WHERE id = $1`, [taskId])
    if (tc.length === 0) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

    // Check existing submission
    const existing = await query(`SELECT id FROM task_submissions WHERE task_id = $1 AND student_id = $2`, [taskId, session.sub])

    if (existing.length > 0) {
      // Update
      const q = `UPDATE task_submissions SET content = $1, file_url = $2, status = 'submitted', submitted_at = NOW() WHERE id = $3 RETURNING *`
      const res = await query(q, [content, file_url, existing[0].id])
      return NextResponse.json({ success: true, data: res[0] })
    } else {
      // Insert
      const q = `
        INSERT INTO task_submissions (task_id, student_id, content, file_url, status, submitted_at)
        VALUES ($1, $2, $3, $4, 'submitted', NOW()) RETURNING *
      `
      const res = await query(q, [taskId, session.sub, content, file_url])
      return NextResponse.json({ success: true, data: res[0] }, { status: 201 })
    }

  } catch (error) {
    console.error('[API] Error submitting task:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
