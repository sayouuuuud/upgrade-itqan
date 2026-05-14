import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { createNotification } from '@/lib/notifications'

/**
 * CRON: Streak break warning
 * Runs near end of day (~11 PM). Finds students who have an active streak
 * but haven't recorded any activity today, and sends them a reminder.
 */
export async function GET(req: NextRequest) {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split('T')[0]

    // Find students with active streaks (>=1 day) who have NOT done anything today
    const atRisk = await query<{
      user_id: string
      streak_days: number
      last_activity_date: string
    }>(`
      SELECT up.user_id, up.streak_days, up.last_activity_date
      FROM user_points up
      JOIN users u ON u.id = up.user_id
      WHERE up.streak_days >= 1
        AND (up.last_activity_date IS NULL OR up.last_activity_date < $1::date)
        AND u.is_active = true
    `, [todayStr])

    let sent = 0

    for (const student of atRisk) {
      // Check if we already sent a streak reminder today (avoid duplicates)
      const existing = await query(
        `SELECT id FROM notifications
         WHERE user_id = $1
           AND type = 'streak_reminder'
           AND created_at >= $2::date
         LIMIT 1`,
        [student.user_id, todayStr],
      )

      if (existing.length > 0) continue

      await createNotification({
        userId: student.user_id,
        type: 'streak_reminder',
        title: 'لا تكسر الـ Streak!',
        message: `عندك ${student.streak_days} يوم متواصل! سجّل نشاطك اليوم عشان تحافظ على الـ Streak.`,
        category: 'general',
        link: '/academy/student/memorization',
      })

      sent++
    }

    return NextResponse.json({
      success: true,
      at_risk: atRisk.length,
      notifications_sent: sent,
    })
  } catch (error) {
    console.error('Error in streak reminders cron:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
