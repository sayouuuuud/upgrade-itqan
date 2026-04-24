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
      .from('halaqat')
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
    const { name, description, teacher_id, gender, max_students, meeting_link } = await req.json()
    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })
    const { data, error } = await supabase
      .from('halaqat')
      .insert({
        name,
        description: description || null,
        teacher_id: teacher_id || null,
        gender: gender || 'both',
        max_students: max_students || 20,
        meeting_link: meeting_link || null,
        is_active: true,
        created_at: new Date().toISOString(),
      })
      .select().single()
    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
