import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const courses = await query<{ id: string }>(
      `SELECT id FROM courses WHERE teacher_id = $1`,
      [session.sub]
    )

    if (courses.length === 0) {
      return NextResponse.json([])
    }

    const courseIds = courses.map((c) => c.id)

    const stats = await query<any>(
      `
        SELECT
          e.student_id,
          u.name AS student_name,
          COUNT(DISTINCT CASE WHEN ml.juz_number IS NOT NULL THEN ml.juz_number END) AS total_juz,
          COUNT(DISTINCT CASE WHEN ml.surah_number IS NOT NULL THEN ml.surah_number END) AS completed_suwar,
          ROUND(
            COUNT(DISTINCT CASE WHEN ml.juz_number IS NOT NULL THEN ml.juz_number END) * 100.0 / 30
          )::INT AS progress_percent,
          MAX(ml.created_at) AS last_recitation
        FROM enrollments e
        JOIN users u ON e.student_id = u.id
        LEFT JOIN memorization_log ml ON ml.student_id = e.student_id
        WHERE e.course_id = ANY($1::UUID[])
          AND e.status = 'active'
        GROUP BY e.student_id, u.name
        ORDER BY progress_percent DESC
      `,
      [courseIds]
    )

    return NextResponse.json(stats)
  } catch (err) {
    console.error('[Teacher Memorization GET]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
