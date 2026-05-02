import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

/**
 * GET /api/academy/admin/fiqh
 *
 * Optional query params:
 *   - status: 'pending' | 'answered' | 'published' | 'all'  (default: all)
 *   - category: any of the constrained values from the schema
 *   - search: substring match against question/answer text
 *   - limit: max rows (default 200)
 */
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || !['academy_admin', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)
  const status = url.searchParams.get('status') || 'all'
  const category = url.searchParams.get('category') || ''
  const search = (url.searchParams.get('search') || '').trim()
  const limitRaw = parseInt(url.searchParams.get('limit') || '200', 10)
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 500) : 200

  try {
    const conditions: string[] = []
    const params: any[] = []

    if (status === 'pending') {
      conditions.push(`fq.answer IS NULL`)
    } else if (status === 'answered') {
      conditions.push(`fq.answer IS NOT NULL`)
    } else if (status === 'published') {
      conditions.push(`fq.is_published = TRUE`)
    } else if (status === 'unpublished') {
      conditions.push(`fq.is_published = FALSE AND fq.answer IS NOT NULL`)
    }

    if (category) {
      params.push(category)
      conditions.push(`fq.category = $${params.length}`)
    }

    if (search) {
      params.push(`%${search}%`)
      conditions.push(
        `(fq.question ILIKE $${params.length} OR fq.answer ILIKE $${params.length})`
      )
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    params.push(limit)

    const rows = await query<any>(
      `
      SELECT fq.id,
             fq.question,
             fq.answer,
             fq.category,
             fq.is_published,
             fq.is_anonymous,
             fq.views_count,
             fq.asked_at,
             fq.answered_at,
             fq.asked_by,
             asker.name           AS asker_name,
             asker.avatar_url     AS asker_avatar,
             fq.answered_by,
             answerer.name        AS answerer_name
        FROM fiqh_questions fq
        LEFT JOIN users asker    ON asker.id    = fq.asked_by
        LEFT JOIN users answerer ON answerer.id = fq.answered_by
        ${where}
        ORDER BY
          CASE WHEN fq.answer IS NULL THEN 0 ELSE 1 END,
          fq.asked_at DESC
        LIMIT $${params.length}
      `,
      params,
    )

    // Aggregate counts so the UI can render tab badges in one round-trip.
    const counts = await query<{ status: string; count: number }>(
      `
      SELECT 'all' AS status, COUNT(*)::int AS count FROM fiqh_questions
      UNION ALL
      SELECT 'pending', COUNT(*)::int FROM fiqh_questions WHERE answer IS NULL
      UNION ALL
      SELECT 'answered', COUNT(*)::int FROM fiqh_questions WHERE answer IS NOT NULL
      UNION ALL
      SELECT 'published', COUNT(*)::int FROM fiqh_questions WHERE is_published = TRUE
      `,
    )
    const countMap: Record<string, number> = {}
    for (const c of counts) countMap[c.status] = Number(c.count) || 0

    return NextResponse.json({ data: rows, counts: countMap })
  } catch (error) {
    console.error('[API] admin/fiqh GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || !['academy_admin', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { question, answer, category, is_published } = await req.json()
    if (!question) return NextResponse.json({ error: 'Question required' }, { status: 400 })

    const result = await query<any>(
      `
      INSERT INTO fiqh_questions
        (question, answer, category, is_published, asked_by, answered_by, asked_at, answered_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7)
      RETURNING *
      `,
      [
        question,
        answer || null,
        category || 'general',
        is_published ? true : false,
        session.sub,                         // admin asks-and-answers
        answer ? session.sub : null,
        answer ? new Date().toISOString() : null,
      ],
    )

    return NextResponse.json({ data: result[0] }, { status: 201 })
  } catch (error) {
    console.error('[API] admin/fiqh POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
