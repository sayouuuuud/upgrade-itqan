import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { createCompetitionStages, type StageInput } from '@/lib/academy/competitions'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || !['admin', 'student_supervisor', 'reciter_supervisor'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const url = new URL(req.url)
    const status = url.searchParams.get('status')
    const type = url.searchParams.get('type')
    const filters: string[] = [`c.scope = 'library'`]
    const params: any[] = []

    if (status && status !== 'all') {
      params.push(status)
      filters.push(`c.status = $${params.length}`)
    }
    if (type && type !== 'all') {
      params.push(type)
      filters.push(`c.type = $${params.length}`)
    }

    const rows = await query(`
      SELECT
        c.*,
        creator.name AS created_by_name,
        winner.name AS winner_name,
        COUNT(ce.id)::int AS entries_count,
        COUNT(ce.id) FILTER (WHERE ce.submission_url IS NOT NULL AND ce.status = 'pending')::int AS pending_count,
        COUNT(ce.id) FILTER (WHERE ce.evaluated_at IS NOT NULL)::int AS evaluated_count,
        COALESCE(AVG(ce.score), 0)::float AS average_score
      FROM competitions c
      LEFT JOIN users creator ON creator.id = c.created_by
      LEFT JOIN users winner ON winner.id = c.winner_id
      LEFT JOIN competition_entries ce ON ce.competition_id = c.id
      WHERE ${filters.join(' AND ')}
      GROUP BY c.id, creator.name, winner.name
      ORDER BY c.created_at DESC
    `, params)

    return NextResponse.json({ data: rows })
  } catch (error) {
    console.error('Error fetching library competitions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || !['admin', 'student_supervisor', 'reciter_supervisor'].includes(session.role)) {
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
      min_verses,
      is_featured,
      certificate_enabled,
      award_top_n,
      certificate_template_id,
      stages,
    } = await req.json()

    if (!title || !start_date || !end_date) {
      return NextResponse.json({ error: 'العنوان وتاريخ البداية والنهاية مطلوبة' }, { status: 400 })
    }

    const now = new Date()
    const start = new Date(start_date)
    const status = start > now ? 'upcoming' : 'active'

    const result = await query(`
      INSERT INTO competitions (
        title, description, type, start_date, end_date, max_participants,
        prizes_description, rules, status, created_by, tajweed_rules,
        badge_key, points_multiplier, min_verses, is_featured, scope, created_at,
        certificate_enabled, award_top_n, certificate_template_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'library', NOW(), $16, $17, $18)
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
          ? tajweed_rules.split(',').map((s: string) => s.trim()).filter(Boolean)
          : null,
      badge_key || 'star_of_halaqah',
      Number(points_multiplier) > 0 ? Number(points_multiplier) : 1,
      Number(min_verses) > 0 ? Number(min_verses) : 0,
      Boolean(is_featured),
      Boolean(certificate_enabled),
      award_top_n ? Number(award_top_n) : null,
      certificate_template_id || null,
    ])

    // Set up the competition's stages (rounds). When no/one stage is provided,
    // a single implicit round is created so behaviour matches a classic contest.
    await createCompetitionStages(
      result[0].id,
      Array.isArray(stages) ? (stages as StageInput[]) : [],
      { min_verses: Number(min_verses) > 0 ? Number(min_verses) : null, tajweed_rules: null, start_date, end_date },
    )

    return NextResponse.json({ data: result[0] }, { status: 201 })
  } catch (error) {
    console.error('Error creating library competition:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
