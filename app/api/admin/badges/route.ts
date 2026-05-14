import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import { adminAwardBadge } from '@/lib/academy/badges'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const includeStats = searchParams.get('stats') === 'true'

  try {
    const definitions = await query(`
      SELECT bd.*,
             (SELECT COUNT(*)::int FROM badges b WHERE b.badge_key = bd.badge_key) as earned_count
      FROM badge_definitions bd
      ORDER BY bd.display_order, bd.created_at
    `)

    if (includeStats) {
      const totalStudents = await queryOne<{ cnt: number }>(
        `SELECT COUNT(DISTINCT user_id)::int as cnt FROM badges`,
      )
      const totalBadgesAwarded = await queryOne<{ cnt: number }>(
        `SELECT COUNT(*)::int as cnt FROM badges`,
      )
      const recentAwards = await query(`
        SELECT b.badge_key, b.badge_name, b.awarded_at, u.name as user_name, u.email
        FROM badges b
        JOIN users u ON u.id = b.user_id
        ORDER BY b.awarded_at DESC
        LIMIT 20
      `)
      return NextResponse.json({
        data: definitions,
        stats: {
          total_definitions: definitions.length,
          total_students_with_badges: totalStudents?.cnt ?? 0,
          total_badges_awarded: totalBadgesAwarded?.cnt ?? 0,
        },
        recent_awards: recentAwards,
      })
    }

    return NextResponse.json({ data: definitions })
  } catch (error) {
    console.error('Error fetching badges:', error)
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

    if (body.action === 'award_to_student') {
      const { user_id, badge_key } = body
      if (!user_id || !badge_key) {
        return NextResponse.json({ error: 'user_id and badge_key required' }, { status: 400 })
      }
      const awarded = await adminAwardBadge(user_id, badge_key)
      return NextResponse.json({ success: true, awarded })
    }

    if (body.action === 'revoke_from_student') {
      const { user_id, badge_key } = body
      if (!user_id || !badge_key) {
        return NextResponse.json({ error: 'user_id and badge_key required' }, { status: 400 })
      }
      await query(
        `DELETE FROM badges WHERE user_id = $1 AND badge_key = $2`,
        [user_id, badge_key],
      )
      return NextResponse.json({ success: true })
    }

    const {
      badge_key, badge_name, badge_description, badge_icon,
      badge_image_url, badge_color, points_awarded,
      criteria_type, criteria_value, category, display_order,
    } = body

    if (!badge_name || !badge_key) {
      return NextResponse.json({ error: 'badge_key and badge_name required' }, { status: 400 })
    }

    const result = await query(`
      INSERT INTO badge_definitions
        (badge_key, badge_name, badge_description, badge_icon, badge_image_url, badge_color,
         points_awarded, criteria_type, criteria_value, category, display_order, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true)
      RETURNING *
    `, [
      badge_key, badge_name, badge_description || null, badge_icon || '🏆',
      badge_image_url || null, badge_color || '#F59E0B', points_awarded || 0,
      criteria_type || 'manual', criteria_value || 0, category || 'achievement',
      display_order || 0,
    ])

    return NextResponse.json({ data: result[0] }, { status: 201 })
  } catch (error) {
    console.error('Error creating badge:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
