import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getSignedRecordingUrl, extractKeyFromUrl } from '@/lib/recordings-s3'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const urlStr = req.nextUrl.searchParams.get('url')
  if (!urlStr) return NextResponse.json({ error: 'Missing url' }, { status: 400 })

  const key = extractKeyFromUrl(urlStr)
  if (!key) return NextResponse.redirect(urlStr)

  const signed = await getSignedRecordingUrl(key)
  if (!signed) return NextResponse.redirect(urlStr)

  return NextResponse.redirect(signed)
}
