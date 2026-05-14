import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { sendAdminActivityReport } from '@/lib/admin/activity-reports'

function isCronAuthorized(req: NextRequest) {
  const expected = process.env.CRON_SECRET
  if (!expected) return true
  const token = req.headers.get('x-cron-secret') || req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || new URL(req.url).searchParams.get('secret')
  return token === expected
}

async function run(req: NextRequest) {
  const url = new URL(req.url)
  const period = url.searchParams.get('period') === 'monthly' ? 'monthly' : 'weekly'
  const dryRun = url.searchParams.get('dryRun') === '1' || url.searchParams.get('dryRun') === 'true'

  if (!isCronAuthorized(req)) {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    const result = await sendAdminActivityReport(period, dryRun)
    return NextResponse.json({ success: true, period, ...result })
  } catch (error) {
    console.error('[cron admin-activity-reports] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  return run(req)
}

export async function POST(req: NextRequest) {
  return run(req)
}
