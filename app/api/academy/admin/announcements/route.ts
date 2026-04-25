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
      SELECT * FROM announcements ORDER BY created_at DESC
    `)
    return NextResponse.json({ data: rows })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || !['academy_admin', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { title_ar, content_ar, target_audience, priority, is_published } = await req.json()
    if (!title_ar || !content_ar) {
      return NextResponse.json({ error: 'Title and content required' }, { status: 400 })
    }
    const result = await query(`
      INSERT INTO announcements (title_ar, content_ar, target_audience, priority, is_published, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `, [title_ar, content_ar, target_audience || 'all', priority || 'normal', is_published || false])
    
    return NextResponse.json({ data: result[0] }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
