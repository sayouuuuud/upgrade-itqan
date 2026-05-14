import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { buildParentWeeklyReport, getPreviousWeekWindow } from '@/lib/academy/parent-reports'

// GET /api/academy/parent/children/[id]/reports
// Returns detailed report for a specific child: attendance, submissions, grades, teacher comments
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || session.role !== 'parent') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const childId = (await params).id

    const { searchParams } = new URL(req.url)
    const weekStartParam = searchParams.get('weekStart')
    const weekEndParam = searchParams.get('weekEnd')
    const { weekStart, weekEnd } = weekStartParam && weekEndParam
      ? { weekStart: weekStartParam, weekEnd: weekEndParam }
      : getPreviousWeekWindow()

    const link = await query<{
      id: string
      parent_id: string
      child_id: string
      parent_child_id: string
      parent_name: string
      parent_email: string
      child_name: string
    }>(
      `SELECT pc.id,
              pc.parent_id,
              pc.child_id,
              pc.id AS parent_child_id,
              p.name AS parent_name,
              p.email AS parent_email,
              c.name AS child_name
         FROM parent_children pc
         JOIN users p ON p.id = pc.parent_id
         JOIN users c ON c.id = pc.child_id
        WHERE pc.parent_id = $1
          AND pc.child_id = $2
          AND pc.status IN ('active', 'approved')`,
      [session.sub, childId]
    )
    if (link.length === 0) {
      return NextResponse.json({ error: 'Unauthorized: Not your child' }, { status: 403 })
    }

    // Courses enrolled
    const courses = await query<any>(`
      SELECT 
        c.id, c.title, c.level,
        u.name as teacher_name,
        e.status as enrollment_status,
        e.enrolled_at,
        COUNT(DISTINCT l.id)::int as total_lessons,
        COUNT(DISTINCT CASE WHEN lp.is_completed = true THEN lp.lesson_id END)::int as completed_lessons
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      JOIN users u ON c.teacher_id = u.id
      LEFT JOIN lessons l ON l.course_id = c.id
      LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.enrollment_id = e.id
      WHERE e.student_id = $1 AND e.status = 'active'
      GROUP BY c.id, c.title, c.level, u.name, e.status, e.enrolled_at
    `, [childId])

    // Task submissions
    const submissions = await query<any>(`
      SELECT 
        t.title as task_title,
        t.due_date,
        ts.status,
        ts.score,
        ts.submitted_at,
        ts.feedback as teacher_comment,
        c.title as course_title
      FROM task_submissions ts
      JOIN tasks t ON ts.task_id = t.id
      JOIN courses c ON t.course_id = c.id
      WHERE ts.student_id = $1
      ORDER BY ts.submitted_at DESC
      LIMIT 20
    `, [childId])

    // Overall stats
    const stats = await query<any>(`
      SELECT
        COUNT(DISTINCT e.id)::int as total_courses,
        COUNT(DISTINCT ts.id)::int as total_submissions,
        COUNT(DISTINCT CASE WHEN ts.status = 'graded' THEN ts.id END)::int as graded_tasks,
        COALESCE(AVG(CASE WHEN ts.status = 'graded' THEN ts.score END), 0)::numeric(5,2) as avg_grade
      FROM enrollments e
      LEFT JOIN tasks t ON t.course_id = e.course_id
      LEFT JOIN task_submissions ts ON ts.task_id = t.id AND ts.student_id = e.student_id
      WHERE e.student_id = $1 AND e.status = 'active'
    `, [childId])

    const weekly = await buildParentWeeklyReport(link[0], weekStart, weekEnd)

    return NextResponse.json({
      courses,
      submissions,
      stats: {
        ...(stats[0] || {}),
        recitations_count: weekly.recitationsCount,
        sessions_attended: weekly.sessionsAttended,
        badges_earned: weekly.badgesEarned,
        current_level: weekly.currentLevel,
      },
      weekly
    })
  } catch (error) {
    console.error('[API] Error fetching child reports:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
