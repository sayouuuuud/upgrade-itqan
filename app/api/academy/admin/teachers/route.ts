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
      .from('users')
      .select('*, courses(count)')
      .eq('role', 'teacher')
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching teachers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || !requireRole(session, ['academy_admin', 'admin'])) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { name, email, password, gender } = await req.json()
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 })
    }

    // Create user with teacher role
    const { data, error } = await supabase
      .from('users')
      .insert({
        name,
        email,
        password_hash: password, // should be hashed in production - handled by trigger/auth
        role: 'teacher',
        gender: gender || 'male',
        is_active: true,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    console.error('Error creating teacher:', error)
    if (error.code === '23505') {
      return NextResponse.json({ error: 'البريد الإلكتروني مستخدم بالفعل' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
