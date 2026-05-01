import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || !['supervisor', 'student_supervisor', 'reciter_supervisor'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const tab = searchParams.get('tab') || 'all'
    const search = searchParams.get('search') || ''

    let whereClause = 'WHERE 1=1'
    let params: any[] = []

    if (tab === 'pending') {
      whereClause += ' AND fq.answer IS NULL'
    } else if (tab === 'answered') {
      whereClause += ' AND fq.answer IS NOT NULL AND fq.is_published = false'
    } else if (tab === 'published') {
      whereClause += ' AND fq.is_published = true'
    }

    if (search) {
      whereClause += ` AND (fq.question ILIKE $${params.length + 1} OR fq.category ILIKE $${params.length + 2})`
      params.push(`%${search}%`, `%${search}%`)
    }

    const rows = await query(`
      SELECT fq.id, fq.question, fq.category, fq.answer, fq.answered_by,
             fq.is_published, u.name AS asker_name, fq.created_at
        FROM fiqh_questions fq
        LEFT JOIN users u ON fq.user_id = u.id
       ${whereClause}
       ORDER BY fq.created_at DESC
    `, params)

    const counts = await query(`
      SELECT
        COUNT(*) FILTER (WHERE answer IS NULL) AS pending,
        COUNT(*) FILTER (WHERE answer IS NOT NULL AND is_published = false) AS answered,
        COUNT(*) FILTER (WHERE is_published = true) AS published
        FROM fiqh_questions
    `)

    return NextResponse.json({
      questions: rows,
      counts: counts[0] || { pending: 0, answered: 0, published: 0 },
    })
  } catch (error) {
    console.error('[Supervisor fiqh]', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
