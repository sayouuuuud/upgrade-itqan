import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import { adminAdjustPoints, POINTS, LEVELS } from '@/lib/academy/points'
import { getSetting, clearSettingCache } from '@/lib/settings'

const DEFAULT_POINTS_CONFIG = { ...POINTS }

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('user_id')
  const searchQuery = searchParams.get('search')

  try {
    const savedConfig = await getSetting('points_config', DEFAULT_POINTS_CONFIG)

    // Search students
    if (searchQuery) {
      const students = await query(
        `SELECT u.id, u.name, u.email, u.role,
                COALESCE(up.total_points, 0) as total_points,
                COALESCE(up.level, 'beginner') as level,
                COALESCE(up.streak_days, 0) as streak_days
         FROM users u
         LEFT JOIN user_points up ON up.user_id = u.id
         WHERE u.role = 'student'
           AND (u.name ILIKE $1 OR u.email ILIKE $1)
         ORDER BY COALESCE(up.total_points, 0) DESC
         LIMIT 20`,
        [`%${searchQuery}%`],
      )
      return NextResponse.json({ students })
    }

    // Individual student detail
    if (userId) {
      const user = await queryOne(
        `SELECT u.id, u.name, u.email,
                COALESCE(up.total_points, 0) as total_points,
                COALESCE(up.level, 'beginner') as level,
                COALESCE(up.streak_days, 0) as streak_days,
                COALESCE(up.longest_streak, 0) as longest_streak,
                COALESCE(up.total_verses_memorized, 0) as total_verses_memorized,
                COALESCE(up.total_verses_revised, 0) as total_verses_revised,
                up.last_activity_date
         FROM users u
         LEFT JOIN user_points up ON up.user_id = u.id
         WHERE u.id = $1`,
        [userId],
      )
      if (!user) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

      const log = await query(
        `SELECT id, points, reason, description, created_at
         FROM points_log WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
        [userId],
      )
      const badges = await query(
        `SELECT b.badge_key, b.badge_name, b.badge_description, b.awarded_at,
                COALESCE(bd.badge_icon, '🏆') as badge_icon,
                bd.badge_image_url, COALESCE(bd.badge_color, '#F59E0B') as badge_color,
                COALESCE(b.points_awarded, 0) as points_awarded
         FROM badges b
         LEFT JOIN badge_definitions bd ON bd.badge_key = b.badge_key
         WHERE b.user_id = $1 ORDER BY b.awarded_at DESC`,
        [userId],
      )
      const breakdown = await query(
        `SELECT reason, COUNT(*)::int as count, SUM(points)::int as total
         FROM points_log WHERE user_id = $1
         GROUP BY reason ORDER BY total DESC`,
        [userId],
      )
      return NextResponse.json({ user, log, badges, breakdown, points_config: savedConfig, levels: LEVELS })
    }

    // Dashboard
    const stats = await queryOne<{
      total_students: number; total_points_awarded: number; avg_points: number;
      avg_streak: number; max_points: number; max_streak: number
    }>(
      `SELECT
        (SELECT COUNT(*)::int FROM users WHERE role = 'student') as total_students,
        (SELECT COALESCE(SUM(total_points), 0)::int FROM user_points up JOIN users u ON u.id = up.user_id WHERE u.role = 'student') as total_points_awarded,
        (SELECT COALESCE(AVG(total_points), 0)::int FROM user_points up JOIN users u ON u.id = up.user_id WHERE u.role = 'student') as avg_points,
        (SELECT COALESCE(AVG(streak_days), 0)::int FROM user_points up JOIN users u ON u.id = up.user_id WHERE u.role = 'student') as avg_streak,
        (SELECT COALESCE(MAX(total_points), 0)::int FROM user_points up JOIN users u ON u.id = up.user_id WHERE u.role = 'student') as max_points,
        (SELECT COALESCE(MAX(streak_days), 0)::int FROM user_points up JOIN users u ON u.id = up.user_id WHERE u.role = 'student') as max_streak`,
    )
    const levelDist = await query(
      `SELECT COALESCE(up.level, 'beginner') as level, COUNT(*)::int as count
       FROM users u LEFT JOIN user_points up ON up.user_id = u.id
       WHERE u.role = 'student' GROUP BY COALESCE(up.level, 'beginner')`,
    )
    const topStudents = await query(
      `SELECT u.id, u.name, u.email, up.total_points, up.level, up.streak_days
       FROM user_points up JOIN users u ON u.id = up.user_id
       WHERE u.role = 'student'
       ORDER BY up.total_points DESC LIMIT 10`,
    )
    const dailyActivity = await query(
      `SELECT DATE(created_at) as date, COUNT(*)::int as count, SUM(points)::int as points
       FROM points_log WHERE created_at >= NOW() - INTERVAL '14 days'
       GROUP BY DATE(created_at) ORDER BY date DESC`,
    )
    const recentActivity = await query(
      `SELECT pl.id, pl.points, pl.reason, pl.description, pl.created_at, u.name as user_name, u.id as user_id
       FROM points_log pl JOIN users u ON u.id = pl.user_id
       WHERE u.role = 'student'
       ORDER BY pl.created_at DESC LIMIT 30`,
    )

    return NextResponse.json({
      stats, level_distribution: levelDist, top_students: topStudents,
      daily_activity: dailyActivity, recent_activity: recentActivity,
      points_config: savedConfig, levels: LEVELS,
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { action, user_id, points, description, level } = body

    if (action === 'update_config') {
      const config = body.config
      if (!config || typeof config !== 'object') {
        return NextResponse.json({ error: 'Invalid config' }, { status: 400 })
      }
      for (const [key, val] of Object.entries(config)) {
        if (typeof val !== 'number' || val < 0) {
          return NextResponse.json({ error: `Invalid value for ${key}` }, { status: 400 })
        }
      }
      await query(
        `INSERT INTO system_settings (key, value, updated_at)
         VALUES ('points_config', $1::jsonb, NOW())
         ON CONFLICT (key) DO UPDATE SET value = $1::jsonb, updated_at = NOW()`,
        [JSON.stringify(config)],
      )
      clearSettingCache('points_config')
      return NextResponse.json({ success: true })
    }

    if (action === 'reset_streak') {
      await query(
        `UPDATE user_points SET streak_days = 0, updated_at = NOW() WHERE user_id = $1`,
        [user_id],
      )
      return NextResponse.json({ success: true })
    }

    if (action === 'set_level') {
      await query(
        `UPDATE user_points SET level = $1, updated_at = NOW() WHERE user_id = $2`,
        [level, user_id],
      )
      return NextResponse.json({ success: true })
    }

    if (action === 'reset_points') {
      await query(
        `UPDATE user_points SET total_points = 0, level = 'beginner', streak_days = 0, longest_streak = 0, updated_at = NOW()
         WHERE user_id = $1`,
        [user_id],
      )
      return NextResponse.json({ success: true })
    }

    // Default: manual adjust
    if (!user_id || points === undefined) {
      return NextResponse.json({ error: 'user_id and points required' }, { status: 400 })
    }
    const result = await adminAdjustPoints(user_id, Number(points), description || 'تعديل يدوي', session.sub)
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
