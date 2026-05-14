import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function POST(_req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  await query(`UPDATE users SET welcome_referral_id = NULL WHERE id = $1`, [session.sub])
  return NextResponse.json({ success: true })
}
