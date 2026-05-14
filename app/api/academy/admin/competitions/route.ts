import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || !['academy_admin', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const url = new URL(req.url)
    const type = url.searchParams.get('type')
    const status = url.searchParams.get('status')
    const filters: string[] = []
    const params: string[] = []

    if (type && type !== 'all') {
      params.push(type)
      filters.push(`c.type = $${params.length}`)
    }
    if (status && status !== 'all') {
      params.push(status)
      filters.push(`c.status = $${params.length}`)
    }

    const rows = await query(`
      SELECT
        c.*,
        creator.name AS created_by_name,
        winner.name AS winner_name,
        COUNT(ce.id)::int AS entries_count,
        COUNT(ce.id) FILTER (WHERE ce.evaluated_at IS NOT NULL)::int AS evaluated_count,
        COALESCE(AVG(ce.score), 0)::float AS average_score
      FROM competitions c
      LEFT JOIN users creator ON creator.id = c.created_by
      LEFT JOIN users winner ON winner.id = c.winner_id
      LEFT JOIN competition_entries ce ON ce.competition_id = c.id
      ${filters.length ? `WHERE ${filters.join(' AND ')}` : ''}
      GROUP BY c.id, creator.name, winner.name
      ORDER BY c.created_at DESC
    `, params)
    return NextResponse.json({ data: rows })
  } catch (error) {
    console.error('Error fetching competitions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || !['academy_admin', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const {
      title,
      description,
      type,
      start_date,
      end_date,
      max_participants,
      prizes_description,
      rules,
      tajweed_rules,
      badge_key,
      points_multiplier,
      halqa_id,
      min_verses,
      is_featured,
    } = await req.json()
    if (!title || !start_date || !end_date) {
      return NextResponse.json({ error: 'Title, start_date and end_date required' }, { status: 400 })
    }
    const now = new Date()
    const start = new Date(start_date)
    const status = start > now ? 'upcoming' : 'active'
    
    const result = await query(`
      INSERT INTO competitions (
        title, description, type, start_date, end_date, max_participants,
        prizes_description, rules, status, created_by, tajweed_rules,
        badge_key, points_multiplier, halqa_id, min_verses, is_featured, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW())
      RETURNING *
    `, [
      title,
      description || null,
      type || 'monthly',
      start_date,
      end_date,
      max_participants || 100,
      prizes_description || null,
      rules || null,
      status,
      session.sub,
      Array.isArray(tajweed_rules)
        ? tajweed_rules
        : typeof tajweed_rules === 'string' && tajweed_rules.trim()
          ? tajweed_rules.split(',').map((item: string) => item.trim()).filter(Boolean)
          : null,
      badge_key || defaultBadgeForType(type || 'monthly'),
      Number(points_multiplier) > 0 ? Number(points_multiplier) : defaultMultiplierForType(type || 'monthly'),
      halqa_id || null,
      Number(min_verses) > 0 ? Number(min_verses) : 0,
      Boolean(is_featured),
    ])
    
    return NextResponse.json({ data: result[0] }, { status: 201 })
  } catch (error) {
    console.error('Error creating competition:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function defaultBadgeForType(type: string): string {
  if (type === 'ramadan') return 'ramadan_badge'
  if (type === 'tajweed') return 'tajweed_master'
  if (type === 'memorization') return 'hafiz_juz_amma'
  return 'star_of_halaqah'
}

function defaultMultiplierForType(type: string): number {
  return type === 'monthly' || type === 'ramadan' || type === 'tajweed' ? 2 : 1
}
