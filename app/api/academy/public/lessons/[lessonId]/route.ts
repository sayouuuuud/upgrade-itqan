import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  req: NextRequest,
  { params }: { params: { lessonId: string } }
) {
  try {
    const { data, error } = await supabase
      .from('lessons')
      .select(`
        *,
        courses (name, description, teacher_id),
        users (name, bio)
      `)
      .eq('id', params.lessonId)
      .eq('is_public', true)
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching public lesson:', error)
    return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
  }
}
