import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const session = await getSession()
  if (!session || !['teacher', 'admin', 'academy_admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const requestId = (await params).requestId;
    const body = await req.json()
    const { status } = body

    if (!['active', 'rejected'].includes(status)) {
       return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Verify ownership of the course in that enrollment
    const verifyQuery = `
      SELECT e.id FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      WHERE e.id = $1 AND c.teacher_id = $2
    `
    const ownership = await query(verifyQuery, [requestId, session.sub])
    if (ownership.length === 0) {
      return NextResponse.json({ error: 'Not permitted' }, { status: 403 })
    }

    const updateQuery = `
      UPDATE enrollments SET status = $1 WHERE id = $2 RETURNING *
    `
    const result = await query(updateQuery, [status, requestId])

    return NextResponse.json({ success: true, data: result[0] })
  } catch (error) {
    console.error('[API] Error updating enrollment request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
