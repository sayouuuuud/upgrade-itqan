import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getSession()
  
  if (!session || !['academy_admin', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const rows = await query(`
      SELECT 
        fp.*,
        u.name as author_name,
        COUNT(DISTINCT fr.id)::int as replies_count
      FROM forum_posts fp
      LEFT JOIN users u ON fp.user_id = u.id
      LEFT JOIN forum_replies fr ON fp.id = fr.post_id
      GROUP BY fp.id, u.name
      ORDER BY fp.created_at DESC
    `)

    return NextResponse.json({ data: rows })
  } catch (error) {
    console.error('Error fetching forum posts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
