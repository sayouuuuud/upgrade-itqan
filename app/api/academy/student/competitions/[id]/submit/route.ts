import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { submitEntry } from '@/lib/academy/competitions'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const body = await req.json()
    await submitEntry(id, session.sub, {
      submission_url: body.submission_url || null,
      notes: body.notes || null,
      verses_count: body.verses_count || 0,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error submitting entry:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

