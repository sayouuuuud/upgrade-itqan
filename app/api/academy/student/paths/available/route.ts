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
        lp.id,
        lp.title,
        lp.description,
        lp.thumbnail_url,
        lp.subject,
        lp.level,
        lp.total_courses as courses_count,
        lp.estimated_hours,
        (SELECT COUNT(*)::int FROM student_path_progress spp2 WHERE spp2.path_id = lp.id) as enrolled_count
      FROM learning_paths lp
      WHERE lp.is_published = true
        AND NOT EXISTS (
          SELECT 1 FROM student_path_progress spp
          WHERE spp.path_id = lp.id AND spp.student_id = $1
        )
      ORDER BY lp.created_at DESC
    `, [session.sub])

    const data = rows.map((r: Record<string, unknown>) => ({
      ...r,
      estimated_weeks: Math.ceil(((r.estimated_hours as number) || 0) / 5),
    }))

    return NextResponse.json({ data })
  } catch (error) {
    console.error('[API] Error fetching available paths:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
