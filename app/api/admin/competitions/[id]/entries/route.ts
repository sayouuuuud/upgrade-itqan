import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getEntries } from '@/lib/academy/competitions'
import { queryOne } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || !['admin', 'student_supervisor', 'reciter_supervisor'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const competition = await queryOne(
      `SELECT * FROM competitions WHERE id = $1 AND scope = 'library'`,
      [id]
    )
    if (!competition) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const entries = await getEntries(id)
    return NextResponse.json({ competition, entries })
  } catch (error) {
    console.error('Error fetching competition entries:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
