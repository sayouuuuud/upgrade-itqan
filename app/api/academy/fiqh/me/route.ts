import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

// GET: am I an active fiqh officer? returns is_officer + open_count
export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ is_officer: false })
  }
  const officer = await queryOne<{ id: string; is_active: boolean }>(
    `SELECT id, is_active FROM fiqh_officers WHERE user_id = $1 LIMIT 1`,
    [session.sub]
  )
  if (!officer || !officer.is_active) {
    return NextResponse.json({ is_officer: false })
  }
  const open = await queryOne<{ count: number }>(
    `SELECT COUNT(*)::int AS count FROM fiqh_questions
      WHERE assigned_to = $1
        AND status IN ('assigned','in_progress','awaiting_consent')`,
    [session.sub]
  )
  return NextResponse.json({
    is_officer: true,
    open_count: open?.count ?? 0,
  })
}
