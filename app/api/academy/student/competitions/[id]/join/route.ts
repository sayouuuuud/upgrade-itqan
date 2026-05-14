import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { joinCompetition } from '@/lib/academy/competitions'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const body = await req.json().catch(() => ({}))
    const result = await joinCompetition(id, session.sub, body.halqa_id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error joining competition:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
