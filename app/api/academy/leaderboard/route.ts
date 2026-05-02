import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import { computeLevel } from '@/lib/academy/gamification'

/**
 * GET /api/academy/leaderboard?period=weekly|monthly|all_time&limit=50
 *
 * Returns the top N students by points. For `weekly` and `monthly` we sum
 * `points_log` rows in the requested window; `all_time` uses the cached
 * `user_points.total_points`.
 *
 * Response shape:
 *   {
 *     data: [{ rank, user_id, user_name, avatar_url, total_points,
 *              current_level, streak_days, is_current_user }],
 *     current_user: { ...same fields, rank } | null
 *   }
 */
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)
  const period = (url.searchParams.get('period') || 'all_time') as
    | 'weekly'
    | 'monthly'
    | 'all_time'
  const limitRaw = parseInt(url.searchParams.get('limit') || '50', 10)
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 200) : 50

  try {
    let rows: Array<{
      user_id: string
      user_name: string
      avatar_url: string | null
      total_points: number
      level: string | null
      streak_days: number | null
    }>

    if (period === 'all_time') {
      rows = await query(
        `
        SELECT u.id              AS user_id,
               u.name            AS user_name,
               u.avatar_url      AS avatar_url,
               COALESCE(up.total_points, 0)::int AS total_points,
               up.level          AS level,
               COALESCE(up.streak_days, 0)::int  AS streak_days
          FROM users u
          LEFT JOIN user_points up ON up.user_id = u.id
         WHERE u.role IN ('student', 'reader')
           AND COALESCE(u.is_active, TRUE) = TRUE
         ORDER BY COALESCE(up.total_points, 0) DESC, u.name ASC
         LIMIT $1
        `,
        [limit]
      )
    } else {
      const days = period === 'weekly' ? 7 : 30
      rows = await query(
        `
        WITH window_points AS (
          SELECT user_id, COALESCE(SUM(points), 0)::int AS total_points
            FROM points_log
           WHERE created_at >= NOW() - ($1 || ' days')::interval
           GROUP BY user_id
        )
        SELECT u.id              AS user_id,
               u.name            AS user_name,
               u.avatar_url      AS avatar_url,
               COALESCE(wp.total_points, 0)::int AS total_points,
               up.level          AS level,
               COALESCE(up.streak_days, 0)::int  AS streak_days
          FROM users u
          LEFT JOIN window_points wp ON wp.user_id = u.id
          LEFT JOIN user_points up   ON up.user_id = u.id
         WHERE u.role IN ('student', 'reader')
           AND COALESCE(u.is_active, TRUE) = TRUE
         ORDER BY COALESCE(wp.total_points, 0) DESC, u.name ASC
         LIMIT $2
        `,
        [String(days), limit]
      )
    }

    const data = rows.map((r, idx) => {
      const total = r.total_points || 0
      return {
        rank: idx + 1,
        user_id: r.user_id,
        user_name: r.user_name,
        avatar_url: r.avatar_url,
        total_points: total,
        current_level: levelToNumber((r.level as any) || computeLevel(total)),
        streak_days: r.streak_days || 0,
        is_current_user: r.user_id === session.sub,
      }
    })

    // If the current user isn't in the top N, fetch their position separately.
    let current_user: any = data.find(d => d.is_current_user) || null
    if (!current_user) {
      current_user = await fetchCurrentUserRank(session.sub, period, data.length)
    }

    return NextResponse.json({ data, current_user })
  } catch (error) {
    console.error('[API] leaderboard GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function levelToNumber(level: string): number {
  switch (level) {
    case 'master':       return 5
    case 'hafiz':        return 4
    case 'advanced':     return 3
    case 'intermediate': return 2
    case 'beginner':     return 1
    default:             return 1
  }
}

async function fetchCurrentUserRank(
  userId: string,
  period: 'weekly' | 'monthly' | 'all_time',
  topCount: number,
) {
  try {
    if (period === 'all_time') {
      const me = await queryOne<{
        user_id: string
        user_name: string
        avatar_url: string | null
        total_points: number
        level: string | null
        streak_days: number | null
        rank: number
      }>(
        `
        WITH ranked AS (
          SELECT u.id              AS user_id,
                 u.name            AS user_name,
                 u.avatar_url      AS avatar_url,
                 COALESCE(up.total_points, 0)::int AS total_points,
                 up.level          AS level,
                 COALESCE(up.streak_days, 0)::int  AS streak_days,
                 RANK() OVER (ORDER BY COALESCE(up.total_points, 0) DESC, u.name ASC) AS rank
            FROM users u
            LEFT JOIN user_points up ON up.user_id = u.id
           WHERE u.role IN ('student', 'reader')
             AND COALESCE(u.is_active, TRUE) = TRUE
        )
        SELECT * FROM ranked WHERE user_id = $1
        `,
        [userId]
      )
      if (!me) return null
      return {
        rank: Number(me.rank),
        user_id: me.user_id,
        user_name: me.user_name,
        avatar_url: me.avatar_url,
        total_points: me.total_points || 0,
        current_level: levelToNumber((me.level as any) || computeLevel(me.total_points || 0)),
        streak_days: me.streak_days || 0,
        is_current_user: true,
      }
    }

    const days = period === 'weekly' ? 7 : 30
    const me = await queryOne<{
      user_id: string
      user_name: string
      avatar_url: string | null
      total_points: number
      level: string | null
      streak_days: number | null
      rank: number
    }>(
      `
      WITH window_points AS (
        SELECT user_id, COALESCE(SUM(points), 0)::int AS total_points
          FROM points_log
         WHERE created_at >= NOW() - ($1 || ' days')::interval
         GROUP BY user_id
      ),
      ranked AS (
        SELECT u.id              AS user_id,
               u.name            AS user_name,
               u.avatar_url      AS avatar_url,
               COALESCE(wp.total_points, 0)::int AS total_points,
               up.level          AS level,
               COALESCE(up.streak_days, 0)::int  AS streak_days,
               RANK() OVER (ORDER BY COALESCE(wp.total_points, 0) DESC, u.name ASC) AS rank
          FROM users u
          LEFT JOIN window_points wp ON wp.user_id = u.id
          LEFT JOIN user_points up   ON up.user_id = u.id
         WHERE u.role IN ('student', 'reader')
           AND COALESCE(u.is_active, TRUE) = TRUE
      )
      SELECT * FROM ranked WHERE user_id = $2
      `,
      [String(days), userId]
    )
    if (!me) return null
    return {
      rank: Number(me.rank),
      user_id: me.user_id,
      user_name: me.user_name,
      avatar_url: me.avatar_url,
      total_points: me.total_points || 0,
      current_level: levelToNumber((me.level as any) || computeLevel(me.total_points || 0)),
      streak_days: me.streak_days || 0,
      is_current_user: true,
    }
  } catch (e) {
    console.error('[API] leaderboard current_user error:', e)
    return null
  }
}
