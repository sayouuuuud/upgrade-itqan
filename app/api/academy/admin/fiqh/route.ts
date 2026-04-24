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
      .from('fiqh_questions')
      .select('*')
      .order('asked_at', { ascending: false })
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
    const { question, answer, category, is_published } = await req.json()
    if (!question) return NextResponse.json({ error: 'Question required' }, { status: 400 })
    const { data, error } = await supabase
      .from('fiqh_questions')
      .insert({
        question,
        answer: answer || null,
        category: category || 'general',
        is_published: is_published || false,
        asked_at: new Date().toISOString(),
        answered_at: answer ? new Date().toISOString() : null,
      })
      .select().single()
    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
