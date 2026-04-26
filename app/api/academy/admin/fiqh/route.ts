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
      SELECT * FROM fiqh_questions ORDER BY asked_at DESC
    `)
    return NextResponse.json({ data: rows })
  } catch (error) {
    console.error('Error fetching fiqh questions:', error)
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
    
    const result = await query(`
      INSERT INTO fiqh_questions (question, answer, category, is_published, asked_at, answered_at)
      VALUES ($1, $2, $3, $4, NOW(), $5)
      RETURNING *
    `, [question, answer || null, category || 'general', is_published || false, answer ? new Date().toISOString() : null])
    
    return NextResponse.json({ data: result[0] }, { status: 201 })
  } catch (error) {
    console.error('Error creating fiqh question:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
