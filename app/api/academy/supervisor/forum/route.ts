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
    const limit = 50

    let whereClause = 'WHERE 1=1'
    let searchParam = search ? `%${search}%` : ''

    if (tab === 'reported') {
      whereClause += ' AND fp.is_reported = true'
    } else if (tab === 'resolved') {
      whereClause += ' AND fp.is_resolved = true'
    }

    if (search) {
      whereClause += ' AND (fp.title ILIKE $1 OR fp.content ILIKE $1)'
    }

    const rows = await query(`
      SELECT fp.id, fp.title, fp.content, fp.category, fp.is_reported, fp.is_resolved,
             u.name AS author_name, COUNT(DISTINCT fpr.id) AS report_count,
             fp.created_at
        FROM forum_posts fp
        LEFT JOIN users u ON fp.user_id = u.id
        LEFT JOIN forum_post_reports fpr ON fpr.post_id = fp.id
       ${whereClause}
       GROUP BY fp.id, u.id
       ORDER BY fp.created_at DESC
       LIMIT $${search ? 2 : 1}
    `, search ? [searchParam] : [])

    return NextResponse.json({
      posts: rows,
      total: rows.length,
    })
  } catch (error) {
    console.error('[Supervisor forum]', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session || !['supervisor', 'student_supervisor', 'reciter_supervisor'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { postId, action, reason } = await req.json()

    if (action === 'resolve') {
      await query('UPDATE forum_posts SET is_resolved = true WHERE id = $1', [postId])
    } else if (action === 'report') {
      await query(
        'INSERT INTO forum_post_reports (post_id, reported_by, reason) VALUES ($1, $2, $3)',
        [postId, session.sub, reason || null]
      )
    } else if (action === 'delete') {
      await query('DELETE FROM forum_posts WHERE id = $1', [postId])
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[Supervisor forum PATCH]', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
