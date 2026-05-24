import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getLibraryCompetitions } from '@/lib/academy/competitions'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || undefined

  try {
    const competitions = await getLibraryCompetitions({
      status,
      userId: session.sub,
    })
    return NextResponse.json({ data: competitions })
  } catch (error) {
    console.error('Error fetching student competitions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
