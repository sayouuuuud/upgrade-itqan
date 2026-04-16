import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ inviteCode: string }> }
) {
  try {
    const { inviteCode } = await params
    const { data, error } = await supabase
      .from('invitations')
      .select(`
        *,
        users (name),
        courses (name)
      `)
      .eq('code', inviteCode)
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching invitation:', error)
    return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
  }
}
