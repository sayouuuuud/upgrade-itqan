import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { createNotification } from '@/lib/notifications'

export async function GET() {
  try {
    let sentCount = 0

    const oneHourSessions = await query<{
      session_id: string
      session_title: string
      course_title: string
      student_id: string
      scheduled_at: string
      meeting_link: string | null
    }>(`
      SELECT
        cs.id as session_id,
        cs.title as session_title,
        c.title as course_title,
        e.student_id,
        cs.scheduled_at,
        COALESCE(smi.meeting_link, cs.meeting_link) as meeting_link
      FROM course_sessions cs
      JOIN courses c ON c.id = cs.course_id
      JOIN enrollments e ON e.course_id = cs.course_id AND e.status = 'active'
      LEFT JOIN session_meeting_invites smi ON smi.session_id = cs.id AND smi.student_id = e.student_id
      WHERE cs.status = 'scheduled'
        AND cs.scheduled_at > NOW()
        AND cs.scheduled_at <= NOW() + INTERVAL '1 hour'
        AND NOT EXISTS (
          SELECT 1 FROM notifications n
          WHERE n.user_id = e.student_id
            AND n.type = 'session_reminder'
            AND n.link = '/academy/student/sessions'
            AND n.created_at > NOW() - INTERVAL '2 hours'
            AND n.title LIKE '%ساعة%'
        )
    `)

    for (const s of oneHourSessions) {
      await createNotification({
        userId: s.student_id,
        type: 'session_reminder',
        title: 'تذكير: جلسة بعد أقل من ساعة',
        message: `جلسة "${s.session_title || s.course_title}" ستبدأ قريباً.${s.meeting_link ? ' اضغط للانضمام.' : ''}`,
        category: 'session',
        link: '/academy/student/sessions',
      })
      sentCount++
    }

    const tenMinSessions = await query<{
      session_id: string
      session_title: string
      course_title: string
      student_id: string
      meeting_link: string | null
    }>(`
      SELECT
        cs.id as session_id,
        cs.title as session_title,
        c.title as course_title,
        e.student_id,
        COALESCE(smi.meeting_link, cs.meeting_link) as meeting_link
      FROM course_sessions cs
      JOIN courses c ON c.id = cs.course_id
      JOIN enrollments e ON e.course_id = cs.course_id AND e.status = 'active'
      LEFT JOIN session_meeting_invites smi ON smi.session_id = cs.id AND smi.student_id = e.student_id
      WHERE cs.status = 'scheduled'
        AND cs.scheduled_at > NOW()
        AND cs.scheduled_at <= NOW() + INTERVAL '10 minutes'
        AND NOT EXISTS (
          SELECT 1 FROM notifications n
          WHERE n.user_id = e.student_id
            AND n.type = 'session_reminder'
            AND n.link = '/academy/student/sessions'
            AND n.created_at > NOW() - INTERVAL '15 minutes'
            AND n.title LIKE '%10 دقائق%'
        )
    `)

    for (const s of tenMinSessions) {
      await createNotification({
        userId: s.student_id,
        type: 'session_reminder',
        title: 'الجلسة تبدأ خلال 10 دقائق!',
        message: `جلسة "${s.session_title || s.course_title}" على وشك البدء.${s.meeting_link ? ' اضغط للانضمام الآن.' : ''}`,
        category: 'session',
        link: '/academy/student/sessions',
      })
      sentCount++
    }

    return NextResponse.json({
      success: true,
      sentCount,
      oneHourReminders: oneHourSessions.length,
      tenMinReminders: tenMinSessions.length,
    })
  } catch (error) {
    console.error('[Cron] Session reminders error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
