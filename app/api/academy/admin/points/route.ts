import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import { adminAdjustPoints, POINTS, LEVELS } from '@/lib/academy/points'
import { getSetting, clearSettingCache } from '@/lib/settings'

// Default points config (matches POINTS constant)
const DEFAULT_POINTS_CONFIG = { ...POINTS }

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || !['academy_admin', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('user_id')
  const searchQuery = searchParams.get('search')
  const action = searchParams.get('action')

  try {
    // Get saved points config (or use defaults)
    const savedConfig = await getSetting('points_config', DEFAULT_POINTS_CONFIG)

    // ── Search students ──
    if (searchQuery) {
      const students = await query(
        `SELECT u.id, u.name, u.email, u.role,
                COALESCE(up.total_points, 0) as total_points,
                COALESCE(up.level, 'beginner') as level,
                COALESCE(up.streak_days, 0) as streak_days,
                COALESCE(up.longest_streak, 0) as longest_streak
         FROM users u
         LEFT JOIN user_points up ON up.user_id = u.id
         WHERE (u.name ILIKE $1 OR u.email ILIKE $1)
           AND u.role IN ('student', 'reader')
         ORDER BY COALESCE(up.total_points, 0) DESC
         LIMIT 20`,
        [`%${searchQuery}%`],
      )
      return NextResponse.json({ students })
    }

    // ── Individual student detail ──
    if (userId) {
      const user = await queryOne(
        `SELECT u.id, u.name, u.email, u.role, u.created_at as user_created_at,
                COALESCE(up.total_points, 0) as total_points,
                COALESCE(up.level, 'beginner') as level,
                COALESCE(up.streak_days, 0) as streak_days,
                COALESCE(up.longest_streak, 0) as longest_streak,
                up.last_activity_date,
                COALESCE(up.total_verses_memorized, 0) as total_verses_memorized,
                COALESCE(up.total_verses_revised, 0) as total_verses_revised
         FROM users u
         LEFT JOIN user_points up ON up.user_id = u.id
         WHERE u.id = $1`,
        [userId],
      )
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

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

      // Points breakdown by reason
      const breakdown = await query(
        `SELECT reason, COUNT(*)::int as count, SUM(points)::int as total
         FROM points_log WHERE user_id = $1
         GROUP BY reason ORDER BY total DESC`,
        [userId],
      )

      return NextResponse.json({
        user,
        log,
        badges,
        breakdown,
        points_config: savedConfig,
        levels: LEVELS,
      })
    }

    // ── Dashboard overview ──
    const stats = await queryOne<{
      total_students: number
      total_points_awarded: number
      avg_points: number
      avg_streak: number
      max_points: number
      max_streak: number
    }>(`
      SELECT
        COUNT(*)::int as total_students,
        COALESCE(SUM(total_points), 0)::int as total_points_awarded,
        COALESCE(ROUND(AVG(total_points)), 0)::int as avg_points,
        COALESCE(ROUND(AVG(streak_days)), 0)::int as avg_streak,
        COALESCE(MAX(total_points), 0)::int as max_points,
        COALESCE(MAX(streak_days), 0)::int as max_streak
      FROM user_points
    `)

    const levelDistribution = await query(`
      SELECT level, COUNT(*)::int as count
      FROM user_points
      GROUP BY level
      ORDER BY CASE level
        WHEN 'beginner' THEN 1
        WHEN 'intermediate' THEN 2
        WHEN 'advanced' THEN 3
        WHEN 'hafiz' THEN 4
      END
    `)

    const recentActivity = await query(`
      SELECT pl.id, pl.user_id, pl.points, pl.reason, pl.description, pl.created_at,
             u.name as user_name, u.email as user_email
      FROM points_log pl
      JOIN users u ON u.id = pl.user_id
      ORDER BY pl.created_at DESC
      LIMIT 30
    `)

    // Top students
    const topStudents = await query(`
      SELECT u.id, u.name, u.email,
             up.total_points, up.level, up.streak_days, up.longest_streak
      FROM user_points up
      JOIN users u ON u.id = up.user_id
      ORDER BY up.total_points DESC
      LIMIT 10
    `)

    // Points activity by day (last 14 days)
    const dailyActivity = await query(`
      SELECT DATE(created_at) as day, COUNT(*)::int as transactions, SUM(points)::int as total_points
      FROM points_log
      WHERE created_at >= NOW() - INTERVAL '14 days'
      GROUP BY DATE(created_at)
      ORDER BY day DESC
    `)

    return NextResponse.json({
      stats,
      level_distribution: levelDistribution,
      recent_activity: recentActivity,
      top_students: topStudents,
      daily_activity: dailyActivity,
      points_config: savedConfig,
      levels: LEVELS,
    })
  } catch (error) {
    console.error('Error fetching admin points:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || !['academy_admin', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { action } = body

    // ── Update points config ──
    if (action === 'update_config') {
      const { config } = body
      if (!config || typeof config !== 'object') {
        return NextResponse.json({ error: 'Invalid config' }, { status: 400 })
      }

      // Validate all values are positive numbers
      for (const [key, val] of Object.entries(config)) {
        if (typeof val !== 'number' || val < 0) {
          return NextResponse.json({ error: `قيمة غير صحيحة للحقل: ${key}` }, { status: 400 })
        }
      }

      // Upsert into system_settings
      await query(
        `INSERT INTO system_settings (setting_key, setting_value, setting_type, description, updated_by)
         VALUES ('points_config', $1::jsonb, 'general', 'إعدادات نظام النقاط', $2)
         ON CONFLICT (setting_key) DO UPDATE SET
           setting_value = $1::jsonb,
           updated_by = $2,
           updated_at = NOW()`,
        [JSON.stringify(config), session.sub],
      )

      clearSettingCache('points_config')

      return NextResponse.json({ success: true, config })
    }

    // ── Reset student streak ──
    if (action === 'reset_streak') {
      const { user_id } = body
      if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 })

      await query(
        `UPDATE user_points SET streak_days = 0, last_activity_date = NULL, updated_at = NOW()
         WHERE user_id = $1`,
        [user_id],
      )

      return NextResponse.json({ success: true, message: 'تم إعادة تعيين الـ Streak' })
    }

    // ── Set student level ──
    if (action === 'set_level') {
      const { user_id, level } = body
      if (!user_id || !level) return NextResponse.json({ error: 'user_id and level required' }, { status: 400 })

      const validLevels = LEVELS.map(l => l.key)
      if (!validLevels.includes(level)) {
        return NextResponse.json({ error: 'مستوى غير صحيح' }, { status: 400 })
      }

      await query(
        `INSERT INTO user_points (user_id, level, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (user_id) DO UPDATE SET level = $2, updated_at = NOW()`,
        [user_id, level],
      )

      return NextResponse.json({ success: true, level })
    }

    // ── Reset all points (for a student) ──
    if (action === 'reset_points') {
      const { user_id } = body
      if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 })

      await query(
        `UPDATE user_points SET total_points = 0, level = 'beginner', streak_days = 0,
         longest_streak = 0, last_activity_date = NULL, updated_at = NOW()
         WHERE user_id = $1`,
        [user_id],
      )

      // Log the reset
      await query(
        `INSERT INTO points_log (user_id, points, reason, description, related_entity_type, related_entity_id)
         VALUES ($1, 0, 'admin_adjust', 'إعادة تعيين كامل للنقاط', 'admin', $2)`,
        [user_id, session.sub],
      )

      return NextResponse.json({ success: true, message: 'تم إعادة تعيين كل النقاط' })
    }

    // ── Default: manual point adjustment ──
    const { user_id, points, description } = body
    if (!user_id || points === undefined) {
      return NextResponse.json({ error: 'user_id and points are required' }, { status: 400 })
    }

    const result = await adminAdjustPoints(
      user_id,
      Number(points),
      description || 'تعديل يدوي من الأدمن',
      session.sub,
    )

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('Error in admin points:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
