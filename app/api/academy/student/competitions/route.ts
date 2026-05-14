import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getCompetitions, getStudentEntries } from '@/lib/academy/competitions'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || undefined
  const type = searchParams.get('type') || undefined
  const view = searchParams.get('view') || 'browse'

  try {
    if (view === 'my_entries') {
      const entries = await getStudentEntries(session.sub)
      return NextResponse.json({ data: entries })
    }

    const competitions = await getCompetitions({
      status,
      type,
      userId: session.sub,
    })
    return NextResponse.json({ data: competitions })
  } catch (error) {
    console.error('Error fetching student competitions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
