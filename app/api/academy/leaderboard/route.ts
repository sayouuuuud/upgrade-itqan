import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import { computeLevel } from '@/lib/academy/gamification'

type Period = 'weekly' | 'monthly' | 'all_time'

type LeaderboardRow = {
  user_id: string
  user_name: string
  avatar_url: string | null
  halaqah_id: string | null
  halaqa_name: string | null
  total_points: number
  level: string | null
  streak_days: number | null
  rank: number
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const period = (url.searchParams.get('period') || 'all_time') as Period
  const scope = url.searchParams.get('scope') || 'platform'
  const requestedHalqaId = url.searchParams.get('halqa_id')
  const limitRaw = parseInt(url.searchParams.get('limit') || '50', 10)
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 200) : 50

  try {
    const halaqaId = scope === 'halaqa'
      ? requestedHalqaId || await getUserHalaqaId(session.sub)
      : null
    const rows = await fetchLeaderboardRows(period, limit, halaqaId)
    const data = rows.map((row) => mapRow(row, session.sub))
    let current_user = data.find((row) => row.is_current_user) || null

    if (!current_user) {
      const currentRow = await fetchCurrentUserRank(session.sub, period, halaqaId)
      current_user = currentRow ? mapRow(currentRow, session.sub) : null
    }

    return NextResponse.json({ data, current_user, scope, halaqa_id: halaqaId })
  } catch (error) {
    console.error('[API] leaderboard GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function mapRow(row: LeaderboardRow, currentUserId: string) {
  const total = Number(row.total_points || 0)
  return {
    rank: Number(row.rank),
    user_id: row.user_id,
    user_name: row.user_name,
    avatar_url: row.avatar_url,
    halaqah_id: row.halaqah_id,
    halaqa_name: row.halaqa_name,
    total_points: total,
    current_level: levelToNumber(row.level || computeLevel(total)),
    streak_days: Number(row.streak_days || 0),
    is_current_user: row.user_id === currentUserId,
  }
}

async function getUserHalaqaId(userId: string) {
  const row = await queryOne<{ halaqah_id: string | null }>(
    `SELECT halaqah_id FROM users WHERE id = $1`,
    [userId]
  )
  return row?.halaqah_id || null
}

async function fetchLeaderboardRows(period: Period, limit: number, halaqaId: string | null) {
  const params: Array<string | number> = []
  const where = ["u.role IN ('student', 'reader')", 'COALESCE(u.is_active, TRUE) = TRUE']
  if (halaqaId) {
    params.push(halaqaId)
    where.push(`u.halaqah_id = $${params.length}`)
  }
  params.push(limit)
  const limitParam = `$${params.length}`
  const days = period === 'weekly' ? 7 : period === 'monthly' ? 30 : null

  return query<LeaderboardRow>(`
    ${days ? `
    WITH window_points AS (
      SELECT user_id, COALESCE(SUM(points), 0)::int AS total_points
      FROM points_log
      WHERE created_at >= NOW() - ('${days} days')::interval
      GROUP BY user_id
    )` : ''}
    SELECT
      u.id AS user_id,
      u.name AS user_name,
      u.avatar_url,
      u.halaqah_id,
      h.name AS halaqa_name,
      COALESCE(${days ? 'wp.total_points' : 'up.total_points'}, 0)::int AS total_points,
      up.level,
      COALESCE(up.streak_days, 0)::int AS streak_days,
      RANK() OVER (ORDER BY COALESCE(${days ? 'wp.total_points' : 'up.total_points'}, 0) DESC, u.name ASC) AS rank
    FROM users u
    LEFT JOIN user_points up ON up.user_id = u.id
    ${days ? 'LEFT JOIN window_points wp ON wp.user_id = u.id' : ''}
    LEFT JOIN halaqat h ON h.id = u.halaqah_id
    WHERE ${where.join(' AND ')}
    ORDER BY total_points DESC, u.name ASC
    LIMIT ${limitParam}
  `, params)
}

async function fetchCurrentUserRank(userId: string, period: Period, halaqaId: string | null) {
  const params: Array<string | number> = []
  const where = ["u.role IN ('student', 'reader')", 'COALESCE(u.is_active, TRUE) = TRUE']
  if (halaqaId) {
    params.push(halaqaId)
    where.push(`u.halaqah_id = $${params.length}`)
  }
  params.push(userId)
  const userParam = `$${params.length}`
  const days = period === 'weekly' ? 7 : period === 'monthly' ? 30 : null

  return queryOne<LeaderboardRow>(`
    ${days ? `
    WITH window_points AS (
      SELECT user_id, COALESCE(SUM(points), 0)::int AS total_points
      FROM points_log
      WHERE created_at >= NOW() - ('${days} days')::interval
      GROUP BY user_id
    ),` : 'WITH'}
    ranked AS (
      SELECT
        u.id AS user_id,
        u.name AS user_name,
        u.avatar_url,
        u.halaqah_id,
        h.name AS halaqa_name,
        COALESCE(${days ? 'wp.total_points' : 'up.total_points'}, 0)::int AS total_points,
        up.level,
        COALESCE(up.streak_days, 0)::int AS streak_days,
        RANK() OVER (ORDER BY COALESCE(${days ? 'wp.total_points' : 'up.total_points'}, 0) DESC, u.name ASC) AS rank
      FROM users u
      LEFT JOIN user_points up ON up.user_id = u.id
      ${days ? 'LEFT JOIN window_points wp ON wp.user_id = u.id' : ''}
      LEFT JOIN halaqat h ON h.id = u.halaqah_id
      WHERE ${where.join(' AND ')}
    )
    SELECT * FROM ranked WHERE user_id = ${userParam}
  `, params)
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
