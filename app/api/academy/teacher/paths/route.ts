import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET() {
  const session = await getSession()
  const isAuthorized = session && (session.role === 'teacher' || session.role === 'reader' || session.role === 'admin')
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const rows = await query(`
      SELECT 
        id, title, description, subject, level, is_published,
        thumbnail_url, require_audio,
        total_stages as total_courses,
        estimated_days as estimated_hours,
        (SELECT COUNT(*)::int FROM tajweed_path_enrollments e WHERE e.path_id = tajweed_paths.id) as enrolled_count
      FROM tajweed_paths 
      WHERE created_by = $1 OR manager_id = $1 
      ORDER BY created_at DESC
    `, [session.sub])
    return NextResponse.json({ data: rows })
  } catch (error) {
    console.error('Error fetching teacher paths:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  const isAuthorized = session && (session.role === 'teacher' || session.role === 'reader' || session.role === 'admin')
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { title, description, subject, level, estimated_hours, thumbnail_url, require_audio, is_published } = await req.json()
    if (!title) return NextResponse.json({ error: 'Title required' }, { status: 400 })

    const result = await query(`
      INSERT INTO tajweed_paths (
        title, description, subject, level, estimated_days,
        thumbnail_url, require_audio, is_published,
        created_by, manager_id, total_stages, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9, 0, NOW())
      RETURNING id, title, description, subject, level, is_published, thumbnail_url, require_audio,
                total_stages as total_courses, estimated_days as estimated_hours
    `, [
      title,
      description || null,
      subject || 'tajweed',
      level || 'beginner',
      estimated_hours || 0,
      thumbnail_url || null,
      require_audio === true,
      is_published === true,
      session.sub,
    ])

    return NextResponse.json({ data: result[0] }, { status: 201 })
  } catch (error) {
    console.error('Error creating teacher path:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
