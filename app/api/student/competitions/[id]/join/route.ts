import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { joinCompetition } from '@/lib/academy/competitions'
import { queryOne } from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    // Verify the competition is a library competition and is active
    const competition = await queryOne<{ id: string; status: string; max_participants: number | null }>(
      `SELECT id, status, max_participants FROM competitions WHERE id = $1 AND scope = 'library'`,
      [id]
    )

    if (!competition) {
      return NextResponse.json({ error: 'المسابقة غير موجودة' }, { status: 404 })
    }

    if (competition.status !== 'active') {
      return NextResponse.json({ error: 'المسابقة غير نشطة حالياً' }, { status: 400 })
    }

    // Check if already joined
    const existing = await queryOne(
      `SELECT id FROM competition_entries WHERE competition_id = $1 AND student_id = $2`,
      [id, session.sub]
    )
    if (existing) {
      return NextResponse.json({ error: 'أنت مشترك بالفعل في هذه المسابقة' }, { status: 400 })
    }

    // Check max participants
    if (competition.max_participants) {
      const { count } = await queryOne<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM competition_entries WHERE competition_id = $1`,
        [id]
      ) as { count: string }
      if (parseInt(count) >= competition.max_participants) {
        return NextResponse.json({ error: 'اكتمل عدد المشاركين في هذه المسابقة' }, { status: 400 })
      }
    }

    await joinCompetition(id, session.sub)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error joining competition:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
