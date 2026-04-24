import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSession, requireRole } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || !requireRole(session, ['academy_admin', 'admin'])) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { data, error } = await supabase
      .from('competitions')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || !requireRole(session, ['academy_admin', 'admin'])) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { title, description, type, start_date, end_date, max_participants, prizes_description } = await req.json()
    if (!title || !start_date || !end_date) {
      return NextResponse.json({ error: 'Title, start_date and end_date required' }, { status: 400 })
    }
    const now = new Date()
    const start = new Date(start_date)
    const status = start > now ? 'upcoming' : 'active'
    const { data, error } = await supabase
      .from('competitions')
      .insert({ title, description: description || null, type: type || 'monthly', start_date, end_date, max_participants: max_participants || 100, prizes_description: prizes_description || null, status, created_at: new Date().toISOString() })
      .select().single()
    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
