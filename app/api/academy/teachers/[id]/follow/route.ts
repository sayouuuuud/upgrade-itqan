import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const { id: teacherId } = await params
  if (teacherId === session.sub) {
    return NextResponse.json({ error: 'لا يمكنك متابعة نفسك' }, { status: 400 })
  }

  // Validate the teacher exists and has a teacher-ish role
  const teacher = await queryOne<{ id: string; role: string | null }>(
    `SELECT id, role FROM users WHERE id = $1 LIMIT 1`,
    [teacherId]
  )
  if (!teacher) {
    return NextResponse.json({ error: 'الشيخ غير موجود' }, { status: 404 })
  }

  let source: string | null = null
  try {
    const body = await req.json()
    if (typeof body?.source === 'string') source = body.source.slice(0, 40)
  } catch {
    // empty body is fine
  }

  await query(
    `INSERT INTO teacher_followers (user_id, teacher_id, source)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, teacher_id) DO NOTHING`,
    [session.sub, teacherId, source]
  )

  return NextResponse.json({ success: true, following: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const { id: teacherId } = await params
  await query(
    `DELETE FROM teacher_followers WHERE user_id = $1 AND teacher_id = $2`,
    [session.sub, teacherId]
  )
  return NextResponse.json({ success: true, following: false })
}
