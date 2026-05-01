import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { getUserPointsSummary } from '@/lib/academy/gamification'

/**
 * GET /api/academy/student/points
 *
 * Returns the authenticated user's gamification summary:
 *   - total_points / level / level progress / streak
 *   - badges_earned count
 *   - the last 20 entries from points_log (with reason + description)
 */
export async function GET(_req: NextRequest) {
  const session = await getSession()
  if (!session || !['student', 'teacher', 'parent', 'academy_admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const summary = await getUserPointsSummary(session.sub)

    const log = await query<{
      id: string
      points: number
      reason: string
      description: string | null
      related_entity_type: string | null
      related_entity_id: string | null
      created_at: string
    }>(
      `SELECT id, points, reason, description, related_entity_type, related_entity_id, created_at
         FROM points_log
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 20`,
      [session.sub]
    )

    return NextResponse.json({
      data: {
        // shape kept backwards-compatible: { points: {...}, log: [...] }
        points: {
          user_id: summary.user_id,
          total_points: summary.total_points,
          points: summary.total_points, // alias for older clients
          level: summary.level,
          streak_days: summary.streak_days,
          longest_streak: summary.longest_streak,
          last_activity_date: summary.last_activity_date,
          badges_earned: summary.badges_earned,
          level_progress: summary.level_progress,
        },
        log,
      },
    })
  } catch (error) {
    console.error('[API] student/points GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
