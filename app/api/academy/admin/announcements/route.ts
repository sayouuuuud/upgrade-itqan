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
    // title_en / content_en are NOT NULL in older DBs and the UI only provides
    // the Arabic fields, so backfill the English columns with the Arabic values
    // to avoid a NOT NULL violation (this was the cause of the 500 error).
    const result = await query(`
      INSERT INTO announcements (title_ar, title_en, content_ar, content_en, target_audience, priority, is_published, created_by, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING *
    `, [
      title_ar,
      title_ar,
      content_ar,
      content_ar,
      target_audience || 'all',
      priority || 'normal',
      is_published || false,
      session.sub,
    ])

    return NextResponse.json({ data: result[0] }, { status: 201 })
  } catch (error) {
    console.error('[API] admin/announcements POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
