import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import { LEVELS, levelForPoints, POINTS } from '@/lib/academy/points'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || !['student', 'reader', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const up = await queryOne<{
      total_points: number
      level: string
      streak_days: number
      longest_streak: number
      last_activity_date: string | null
      total_verses_memorized: number
      total_verses_revised: number
    }>(
      `SELECT total_points, level, streak_days, longest_streak,
              last_activity_date, total_verses_memorized, total_verses_revised
       FROM user_points WHERE user_id = $1`,
      [session.sub],
    )

    const totalPoints = up?.total_points ?? 0
    const level = up?.level ?? levelForPoints(totalPoints)
    const streakDays = up?.streak_days ?? 0

    const currentIdx = LEVELS.findIndex(l => l.key === level)
    const nextLevel = currentIdx < LEVELS.length - 1 ? LEVELS[currentIdx + 1] : null
    const pointsToNext = nextLevel ? nextLevel.min - totalPoints : 0

    const streakMultiplierActive = streakDays >= 7

    const log = await query(
      `SELECT id, points, reason, description, created_at
       FROM points_log WHERE user_id = $1
       ORDER BY created_at DESC LIMIT 30`,
      [session.sub],
    )

    const badges = await query(
      `SELECT b.badge_key, b.badge_name, b.badge_description, b.awarded_at,
              COALESCE(bd.badge_icon, '🏆') as badge_icon,
              bd.badge_image_url, COALESCE(bd.badge_color, '#F59E0B') as badge_color,
              COALESCE(b.points_awarded, 0) as points_awarded
       FROM badges b
       LEFT JOIN badge_definitions bd ON bd.badge_key = b.badge_key
       WHERE b.user_id = $1
       ORDER BY b.awarded_at DESC`,
      [session.sub],
    )

    return NextResponse.json({
      total_points: totalPoints,
      level,
      level_label: LEVELS.find(l => l.key === level)?.label ?? 'مبتدئ',
      streak_days: streakDays,
      longest_streak: up?.longest_streak ?? 0,
      streak_multiplier_active: streakMultiplierActive,
      next_level: nextLevel ? { key: nextLevel.key, label: nextLevel.label, min: nextLevel.min } : null,
      points_to_next_level: Math.max(pointsToNext, 0),
      total_verses_memorized: up?.total_verses_memorized ?? 0,
      total_verses_revised: up?.total_verses_revised ?? 0,
      points_config: POINTS,
      levels: LEVELS,
      log,
      badges,
    })
  } catch (error) {
    console.error('Error fetching points:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
