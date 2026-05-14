import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const stats = await query(`
      SELECT
        COALESCE(SUM(new_verses), 0)::int as total_ayahs,
        COALESCE(SUM(revised_verses), 0)::int as total_reviews
      FROM memorization_log
      WHERE student_id = $1
    `, [session.sub])

    const total_ayahs = Number(stats[0]?.total_ayahs) || 0
    const total_reviews = Number(stats[0]?.total_reviews) || 0
    const total_juz = Math.floor(total_ayahs / 208)

    const pointsRow = await query(`
      SELECT streak_days, total_verses_memorized
      FROM user_points
      WHERE user_id = $1
    `, [session.sub])

    const streak_days = pointsRow[0]?.streak_days || 0

    const lastLog = await query(`
      SELECT surah_number, surah_name
      FROM memorization_log
      WHERE student_id = $1 AND new_verses > 0
      ORDER BY log_date DESC
      LIMIT 1
    `, [session.sub])

    return NextResponse.json({
      total_ayahs,
      total_juz,
      total_reviews,
      streak_days,
      last_memorized_surah: lastLog[0]?.surah_number || 0,
      last_memorized_surah_name: lastLog[0]?.surah_name || null,
    })
  } catch (error) {
    console.error('Error fetching memorization progress:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
