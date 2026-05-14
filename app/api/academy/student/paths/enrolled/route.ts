import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const rows = await query(`
      SELECT
        spp.path_id,
        lp.title as path_title,
        lp.description,
        lp.thumbnail_url,
        lp.subject,
        lp.level,
        spp.current_course_id,
        COALESCE(array_length(spp.completed_courses, 1), 0) as completed_courses,
        lp.total_courses,
        spp.progress_percentage as progress_percent,
        spp.started_at
      FROM student_path_progress spp
      JOIN learning_paths lp ON lp.id = spp.path_id
      WHERE spp.student_id = $1
      ORDER BY spp.updated_at DESC
    `, [session.sub])

    return NextResponse.json({ data: rows })
  } catch (error) {
    console.error('[API] Error fetching enrolled paths:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
