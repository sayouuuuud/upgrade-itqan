import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const rows = await query<{ id: string; teacher_name: string | null }>(
    `UPDATE public_lesson_subscribers s
     SET is_verified = true,
         verified_at = COALESCE(verified_at, NOW()),
         verification_token = NULL,
         unsubscribed_at = NULL
     WHERE verification_token = $1
     RETURNING id,
       (SELECT name FROM users WHERE id = s.teacher_id) AS teacher_name`,
    [token]
  )
  if (rows.length === 0) {
    return NextResponse.json({ error: 'Token غير صالح أو منتهي.' }, { status: 404 })
  }
  return NextResponse.json({ success: true, teacher_name: rows[0].teacher_name })
}
