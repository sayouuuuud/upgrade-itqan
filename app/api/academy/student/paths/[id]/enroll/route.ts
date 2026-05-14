import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: pathId } = await params

  try {
    const path = await queryOne<{ id: string; title: string }>(
      `SELECT id, title FROM learning_paths WHERE id = $1 AND is_published = true`,
      [pathId]
    )
    if (!path) {
      return NextResponse.json({ error: 'المسار غير موجود' }, { status: 404 })
    }

    const existing = await queryOne<{ id: string }>(
      `SELECT id FROM student_path_progress WHERE student_id = $1 AND path_id = $2`,
      [session.sub, pathId]
    )
    if (existing) {
      return NextResponse.json({ error: 'أنت مسجل بالفعل في هذا المسار' }, { status: 409 })
    }

    const firstCourse = await queryOne<{ course_id: string }>(
      `SELECT course_id FROM learning_path_courses WHERE path_id = $1 ORDER BY order_index ASC LIMIT 1`,
      [pathId]
    )

    await query(
      `INSERT INTO student_path_progress (student_id, path_id, current_course_id, started_at)
       VALUES ($1, $2, $3, NOW())`,
      [session.sub, pathId, firstCourse?.course_id || null]
    )

    if (firstCourse) {
      try {
        await query(
          `INSERT INTO enrollments (student_id, course_id, status, enrolled_at)
           VALUES ($1, $2, 'active', NOW())`,
          [session.sub, firstCourse.course_id]
        )
      } catch (e: any) {
        if (e.code !== '23505') throw e
      }
    }

    return NextResponse.json({ success: true, message: 'تم التسجيل في المسار بنجاح' }, { status: 201 })
  } catch (error) {
    console.error('[API] Error enrolling in path:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
