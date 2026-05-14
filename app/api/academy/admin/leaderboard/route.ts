import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { computeLevel } from '@/lib/academy/gamification'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || !['academy_admin', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)
  const scope = url.searchParams.get('scope') || 'platform'
  const period = url.searchParams.get('period') || 'all_time'
  const halqaId = url.searchParams.get('halqa_id')
  const limitRaw = Number(url.searchParams.get('limit') || 100)
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 200) : 100
  const days = period === 'weekly' ? 7 : period === 'monthly' ? 30 : null

  try {
    const params: Array<string | number> = []
    const conditions = ["u.role IN ('student', 'reader')", 'COALESCE(u.is_active, TRUE) = TRUE']

    if (scope === 'halaqa' && halqaId) {
      params.push(halqaId)
      conditions.push(`u.halaqah_id = $${params.length}`)
    }

    params.push(limit)
    const limitParam = `$${params.length}`
    const where = conditions.join(' AND ')

    const rows = await query(`
      ${days ? `
      WITH window_points AS (
        SELECT user_id, COALESCE(SUM(points), 0)::int AS points
        FROM points_log
        WHERE created_at >= NOW() - ('${days} days')::interval
        GROUP BY user_id
      )` : ''}
      SELECT
        u.id,
        u.name,
        u.email,
        u.avatar_url,
        u.halaqah_id,
        h.name AS halaqa_name,
        COALESCE(${days ? 'wp.points' : 'up.total_points'}, 0)::int AS total_points,
        COALESCE(up.level, 'beginner') AS level,
        COALESCE(up.streak_days, 0)::int AS streak_days,
        COALESCE(tasks.tasks_completed, 0)::int AS tasks_completed,
        COALESCE(badges.badges_count, 0)::int AS badges_count,
        RANK() OVER (ORDER BY COALESCE(${days ? 'wp.points' : 'up.total_points'}, 0) DESC, u.name ASC) AS rank
      FROM users u
      LEFT JOIN user_points up ON up.user_id = u.id
      ${days ? 'LEFT JOIN window_points wp ON wp.user_id = u.id' : ''}
      LEFT JOIN halaqat h ON h.id = u.halaqah_id
      LEFT JOIN (
        SELECT student_id, COUNT(*)::int AS tasks_completed
        FROM task_submissions
        WHERE status = 'graded'
        GROUP BY student_id
      ) tasks ON tasks.student_id = u.id
      LEFT JOIN (
        SELECT user_id, COUNT(*)::int AS badges_count
        FROM badges
        GROUP BY user_id
      ) badges ON badges.user_id = u.id
      WHERE ${where}
      ORDER BY total_points DESC, u.name ASC
      LIMIT ${limitParam}
    `, params)

    const summary = {
      users_count: rows.length,
      points_total: rows.reduce((sum: number, item: any) => sum + Number(item.total_points || 0), 0),
      badges_total: rows.reduce((sum: number, item: any) => sum + Number(item.badges_count || 0), 0),
      tasks_total: rows.reduce((sum: number, item: any) => sum + Number(item.tasks_completed || 0), 0),
    }

    return NextResponse.json({
      data: rows.map((item: any) => ({
        ...item,
        current_level: levelToNumber(item.level || computeLevel(Number(item.total_points || 0))),
      })),
      summary,
      scope,
      period,
    })
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function levelToNumber(level: string): number {
  switch (level) {
    case 'master': return 5
    case 'hafiz': return 4
    case 'advanced': return 3
    case 'intermediate': return 2
    default: return 1
  }
}
