import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || !['teacher', 'admin', 'academy_admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const q = `
      SELECT 
        e.id,
        e.status,
        e.enrolled_at,
        u.name as student_name,
        u.email as student_email,
        c.title as course_title,
        c.id as course_id
      FROM enrollments e
      JOIN users u ON e.student_id = u.id
      JOIN courses c ON e.course_id = c.id
      WHERE c.teacher_id = $1
      ORDER BY e.enrolled_at DESC
    `
    const rows = await query(q, [session.sub])

    // Also include pending enrollment requests for tajweed paths managed by this teacher.
    let pathRows: any[] = []
    try {
      pathRows = (await query<any>(
        `
        SELECT tpe.id                AS id,
               tpe.status            AS status,
               tpe.started_at        AS enrolled_at,
               u.name                AS student_name,
               u.email               AS student_email,
               tp.title              AS course_title,
               tp.id                 AS path_id,
               'tajweed_path'        AS kind
        FROM tajweed_path_enrollments tpe
        JOIN tajweed_paths tp ON tp.id = tpe.path_id
        JOIN users u ON u.id = tpe.student_id
        WHERE (tp.created_by = $1 OR tp.manager_id = $1)
        ORDER BY tpe.started_at DESC
        `,
        [session.sub],
      )) as any[]
    } catch (err) {
      // Table/columns may not exist in some environments — fail soft.
      console.error('[teacher enrollment-requests] path query skipped:', err)
    }

    return NextResponse.json({ data: [...rows, ...pathRows] })
  } catch (error) {
    console.error('[API] Error fetching enrollments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
