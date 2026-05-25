import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { joinCompetition } from '@/lib/academy/competitions'
import { queryOne } from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const competition = await queryOne<{ id: string }>(
      `SELECT id FROM competitions WHERE id = $1 AND scope = 'academy'`,
      [id]
    )
    if (!competition) {
      return NextResponse.json({ error: 'المسابقة غير موجودة' }, { status: 404 })
    }

    await joinCompetition(id, session.sub)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error joining competition:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

