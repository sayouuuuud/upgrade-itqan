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
      SELECT * FROM learning_paths ORDER BY created_at DESC
    `)
    return NextResponse.json({ data: rows })
  } catch (error) {
    console.error('Error fetching paths:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || !['academy_admin', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { title, description, subject, level, estimated_hours } = await req.json()
    if (!title) return NextResponse.json({ error: 'Title required' }, { status: 400 })
    
    const result = await query(`
      INSERT INTO learning_paths (title, description, subject, level, estimated_hours, created_by, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *
    `, [title, description || null, subject || 'quran', level || 'beginner', estimated_hours || 0, session.sub])
    
    return NextResponse.json({ data: result[0] }, { status: 201 })
  } catch (error) {
    console.error('Error creating path:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
