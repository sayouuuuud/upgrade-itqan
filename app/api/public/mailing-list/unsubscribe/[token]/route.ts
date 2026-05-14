import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

async function unsubscribe(token: string) {
  return query<{ id: string; email: string; teacher_name: string | null }>(
    `UPDATE public_lesson_subscribers s
     SET unsubscribed_at = NOW(), is_verified = false, verification_token = NULL
     WHERE unsubscribe_token = $1 AND unsubscribed_at IS NULL
     RETURNING id, email,
       (SELECT name FROM users WHERE id = s.teacher_id) AS teacher_name`,
    [token]
  )
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const rows = await unsubscribe(token)
  if (rows.length === 0) {
    return NextResponse.json({ success: true, alreadyUnsubscribed: true })
  }
  return NextResponse.json({ success: true, email: rows[0].email, teacher_name: rows[0].teacher_name })
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const rows = await unsubscribe(token)
  return NextResponse.json({ success: true, count: rows.length })
}
