import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

// POST /api/academy/teacher/paths/[id]/enroll-students
// Bulk-enroll students into a path. Body:
//   { student_ids: string[] }                  -> enroll these specific students
//   { course_id: string, all: true }           -> enroll ALL enrolled students of a course
// Seeds progress rows (first stage unlocked, rest locked) like the student
// self-enroll flow. Existing enrollments are skipped; dropped ones reactivated.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  const isAuthorized = session && (session.role === 'teacher' || session.role === 'reader' || session.role === 'admin')
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: pathId } = await params

  try {
    // 1. Verify the path exists and the user manages it
    const pathRows = await query<{ created_by: string; manager_id: string | null }>(
      `SELECT created_by, manager_id FROM tajweed_paths WHERE id = $1 LIMIT 1`,
      [pathId]
    )
    if (pathRows.length === 0) {
      return NextResponse.json({ error: 'Path not found' }, { status: 404 })
    }
    const isManager =
      session.role === 'admin' ||
      pathRows[0].created_by === session.sub ||
      pathRows[0].manager_id === session.sub
    if (!isManager) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    let studentIds: string[] = []

    if (body.all === true && body.course_id) {
      // Resolve all active students of a course the teacher owns
      if (session.role === 'teacher') {
        const owns = await query(
          `SELECT id FROM courses WHERE id = $1 AND teacher_id = $2 LIMIT 1`,
          [body.course_id, session.sub]
        )
        if (owns.length === 0) {
          return NextResponse.json({ error: 'Forbidden course' }, { status: 403 })
        }
      }
      const rows = await query<{ student_id: string }>(
        `SELECT student_id FROM enrollments
          WHERE course_id = $1 AND status <> 'dropped'`,
        [body.course_id]
      )
      studentIds = rows.map((r) => r.student_id)
    } else if (Array.isArray(body.student_ids)) {
      studentIds = body.student_ids.filter((s: unknown): s is string => typeof s === 'string')
    }

    studentIds = Array.from(new Set(studentIds))
    if (studentIds.length === 0) {
      return NextResponse.json({ error: 'No students selected' }, { status: 400 })
    }

    // 2. Load path stages (needed to seed progress)
    const stages = await query<{ id: string }>(
      `SELECT id FROM tajweed_path_stages WHERE path_id = $1 ORDER BY position ASC`,
      [pathId]
    )
    const firstStageId = stages[0]?.id ?? null

    let enrolled = 0
    let reactivated = 0
    let skipped = 0

    for (const studentId of studentIds) {
      const existing = await query<{ id: string; status: string }>(
        `SELECT id, status FROM tajweed_path_enrollments
          WHERE path_id = $1 AND student_id = $2 LIMIT 1`,
        [pathId, studentId]
      )

      if (existing[0]) {
        if (existing[0].status === 'dropped') {
          await query(
            `UPDATE tajweed_path_enrollments SET status = 'active', last_activity_at = NOW() WHERE id = $1`,
            [existing[0].id]
          )
          reactivated++
        } else {
          skipped++
        }
        continue
      }

      const enrollmentRows = await query<{ id: string }>(
        `INSERT INTO tajweed_path_enrollments (path_id, student_id, current_stage_id, status)
         VALUES ($1, $2, $3, 'active') RETURNING id`,
        [pathId, studentId, firstStageId]
      )
      const enrollmentId = enrollmentRows[0].id

      if (stages.length > 0) {
        const values: unknown[] = []
        const placeholders: string[] = []
        let i = 1
        stages.forEach((s, idx) => {
          placeholders.push(`($${i++}, $${i++}, $${i++})`)
          values.push(enrollmentId, s.id, idx === 0 ? 'unlocked' : 'locked')
        })
        await query(
          `INSERT INTO tajweed_path_progress (enrollment_id, stage_id, status) VALUES ${placeholders.join(', ')}`,
          values
        )
      }
      enrolled++
    }

    return NextResponse.json({
      success: true,
      enrolled,
      reactivated,
      skipped,
      total: studentIds.length,
    })
  } catch (error) {
    console.error('Error enrolling students into path:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
