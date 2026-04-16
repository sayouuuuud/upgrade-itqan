import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || !['admin', 'academy_admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    const q = `
      SELECT t.*, u.name, u.email 
      FROM teacher_applications t
      JOIN users u ON t.user_id = u.id
      ORDER BY t.created_at DESC
    `
    const rows = await query(q)
    return NextResponse.json({ data: rows })
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  try {
    const { qualifications, cv_url } = await req.json()
    if (!qualifications) return NextResponse.json({ error: 'qualifications required' }, { status: 400 })
    
    // Check if already applied
    const existing = await query(`SELECT id FROM teacher_applications WHERE user_id = $1`, [session.sub])
    if (existing.length > 0) return NextResponse.json({ error: 'Already applied' }, { status: 400 })

    const q = `
      INSERT INTO teacher_applications (user_id, qualifications, cv_url, status, created_at)
      VALUES ($1, $2, $3, 'pending', NOW()) RETURNING *
    `
    const res = await query(q, [session.sub, qualifications, cv_url || null])
    return NextResponse.json({ data: res[0] })
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
