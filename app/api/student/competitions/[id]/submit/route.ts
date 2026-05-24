import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { submitEntry } from '@/lib/academy/competitions'
import { queryOne } from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const competition = await queryOne<{ id: string; status: string }>(
      `SELECT id, status FROM competitions WHERE id = $1 AND scope = 'library'`,
      [id]
    )
    if (!competition) {
      return NextResponse.json({ error: 'المسابقة غير موجودة' }, { status: 404 })
    }
    if (competition.status !== 'active') {
      return NextResponse.json({ error: 'المسابقة غير نشطة' }, { status: 400 })
    }

    const { submission_url, notes, verses_count } = await req.json()

    await submitEntry(id, session.sub, {
      submission_url: submission_url || null,
      notes: notes || null,
      verses_count: Number(verses_count) || 0,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error submitting entry:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
