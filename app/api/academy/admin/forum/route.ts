import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

const FORUM_CATEGORIES = [
  'general', 'quran', 'fiqh', 'advice', 'youth', 'sisters',
  'announcements', 'questions', 'articles', 'guidance',
]

export async function GET(req: NextRequest) {
  const session = await getSession()
  
  if (!session || !['academy_admin', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const url = new URL(req.url)
    const category = url.searchParams.get('category') || ''

    const conditions: string[] = []
    const params: unknown[] = []

    if (category && category !== 'all') {
      if (!FORUM_CATEGORIES.includes(category)) {
        return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
      }
      params.push(category)
      conditions.push(`fp.category = $${params.length}`)
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    const rows = await query(`
      SELECT 
        fp.*,
        u.name as author_name,
        u.avatar_url as author_avatar,
        COUNT(DISTINCT fr.id)::int as replies_count
      FROM forum_posts fp
      LEFT JOIN users u ON fp.author_id = u.id
      LEFT JOIN forum_replies fr ON fp.id = fr.post_id
      ${where}
      GROUP BY fp.id, u.name, u.avatar_url
      ORDER BY fp.is_pinned DESC, fp.created_at DESC
    `, params)

    return NextResponse.json({ data: rows })
  } catch (error) {
    console.error('Error fetching forum posts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
