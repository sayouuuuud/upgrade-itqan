import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { createNotification } from '@/lib/notifications'

export async function GET() {
  try {
    let morningReminders = 0
    let overdueAlerts = 0

    const todayTasks = await query<{
      task_id: string
      task_title: string
      course_title: string
      student_id: string
      due_date: string
    }>(`
      SELECT
        t.id as task_id,
        t.title as task_title,
        c.title as course_title,
        e.student_id,
        t.due_date
      FROM tasks t
      JOIN courses c ON c.id = t.course_id
      JOIN enrollments e ON e.course_id = t.course_id AND e.status = 'active'
      LEFT JOIN task_submissions ts ON ts.task_id = t.id AND ts.student_id = e.student_id
      WHERE t.status = 'pending'
        AND DATE(t.due_date) = CURRENT_DATE
        AND ts.id IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM notifications n
          WHERE n.user_id = e.student_id
            AND n.type = 'general'
            AND n.link LIKE '%/tasks%'
            AND DATE(n.created_at) = CURRENT_DATE
            AND n.title LIKE '%مهام اليوم%'
        )
    `)

    for (const t of todayTasks) {
      await createNotification({
        userId: t.student_id,
        type: 'general',
        title: 'مهام اليوم',
        message: `لديك مهمة "${t.task_title}" في "${t.course_title}" مطلوب تسليمها اليوم.`,
        category: 'general',
        link: '/academy/student/tasks',
      })
      morningReminders++
    }

    const overdueTasks = await query<{
      task_id: string
      task_title: string
      course_title: string
      student_id: string
      due_date: string
    }>(`
      SELECT
        t.id as task_id,
        t.title as task_title,
        c.title as course_title,
        e.student_id,
        t.due_date
      FROM tasks t
      JOIN courses c ON c.id = t.course_id
      JOIN enrollments e ON e.course_id = t.course_id AND e.status = 'active'
      LEFT JOIN task_submissions ts ON ts.task_id = t.id AND ts.student_id = e.student_id
      WHERE t.status = 'pending'
        AND t.due_date < NOW()
        AND ts.id IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM notifications n
          WHERE n.user_id = e.student_id
            AND n.type = 'general'
            AND n.link LIKE '%/tasks%'
            AND DATE(n.created_at) = CURRENT_DATE
            AND n.title LIKE '%متأخرة%'
        )
    `)

    for (const t of overdueTasks) {
      await createNotification({
        userId: t.student_id,
        type: 'general',
        title: 'مهمة متأخرة!',
        message: `مهمة "${t.task_title}" في "${t.course_title}" تجاوزت موعد التسليم. سلّمها الآن.`,
        category: 'general',
        link: '/academy/student/tasks',
      })
      overdueAlerts++
    }

    return NextResponse.json({
      success: true,
      morningReminders,
      overdueAlerts,
    })
  } catch (error) {
    console.error('[Cron] Task reminders error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
