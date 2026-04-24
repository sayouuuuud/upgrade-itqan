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
      .from('badge_definitions')
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
    const { badge_type, badge_name, badge_description, badge_icon, points_required } = await req.json()
    if (!badge_name) return NextResponse.json({ error: 'Badge name required' }, { status: 400 })
    const { data, error } = await supabase
      .from('badge_definitions')
      .insert({
        badge_type: badge_type || 'achievement',
        badge_name,
        badge_description: badge_description || null,
        badge_icon: badge_icon || '🏆',
        points_required: points_required || 0,
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
