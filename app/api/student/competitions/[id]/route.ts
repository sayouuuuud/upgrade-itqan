import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const competition = await queryOne(
      `SELECT * FROM competitions WHERE id = $1 AND scope = 'library'`,
      [id]
    )
    if (!competition) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const entry = await queryOne(
      `SELECT * FROM competition_entries WHERE competition_id = $1 AND student_id = $2`,
      [id, session.sub]
    )

    return NextResponse.json({ competition, entry: entry || null })
  } catch (error) {
    console.error('Error fetching competition:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
