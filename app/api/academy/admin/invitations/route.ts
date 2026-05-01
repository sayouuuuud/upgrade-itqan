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
      SELECT * FROM invitations ORDER BY created_at DESC
    `)
    return NextResponse.json({ data: rows })
  } catch (error) {
    console.error('Error fetching invitations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || !['academy_admin', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { email, role } = await req.json()
    if (!email) return NextResponse.json({ error: 'البريد الإلكتروني مطلوب' }, { status: 400 })

    // Check if already invited with pending status
    const existing = await query(
      `SELECT id, status FROM invitations 
       WHERE email = $1 AND status = 'PENDING'`,
      [email.toLowerCase()]
    )

    if (existing.length > 0) {
      return NextResponse.json({ error: 'يوجد دعوة معلقة لهذا البريد الإلكتروني بالفعل' }, { status: 400 })
    }

    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    const result = await query(`
      INSERT INTO invitations (email, role_to_assign, token, status, invited_by, expires_at, created_at)
      VALUES ($1, $2, $3, 'PENDING', $4, $5, NOW())
      RETURNING *
    `, [email.toLowerCase(), role || 'student', token, session.sub, expiresAt])

    return NextResponse.json({ data: result[0] }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating invitation:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

