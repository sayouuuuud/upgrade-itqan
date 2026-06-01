import { NextRequest, NextResponse } from 'next/server'

// Edge runtime: stream large PDFs without buffering and avoid serverless
// timeout/body-size limits.
export const runtime = 'edge'

/**
 * PDF Proxy API
 *
 * pdf.js (react-pdf) fetches the PDF from the *browser*. When the file is
 * hosted on UploadThing / S3 (utfs.io, ufs.sh, *.amazonaws.com) those hosts
 * often don't send permissive CORS headers for cross-origin range requests,
 * so the browser blocks the fetch and the viewer shows "Failed to load PDF".
 *
 * Proxying the file through our own origin makes it a same-origin request with
 * correct CORS + Range headers, so the viewer always works. Mirrors the
 * existing /api/audio-proxy pattern.
 *
 * Usage: /api/pdf-proxy?url=<encoded-pdf-url>
 */

// Only allow proxying from known file hosts to prevent this route being used
// as an open proxy (SSRF protection).
const ALLOWED_HOST_SUFFIXES = [
  'utfs.io',
  'ufs.sh',
  'amazonaws.com',
  'cloudinary.com',
  'res.cloudinary.com',
]

function isAllowed(fileUrl: string): boolean {
  try {
    const u = new URL(fileUrl)
    if (u.protocol !== 'https:') return false
    return ALLOWED_HOST_SUFFIXES.some(
      (suffix) => u.hostname === suffix || u.hostname.endsWith(`.${suffix}`),
    )
  } catch {
    return false
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fileUrl = searchParams.get('url')

    if (!fileUrl) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 })
    }

    if (!isAllowed(fileUrl)) {
      return NextResponse.json({ error: 'URL host not allowed' }, { status: 403 })
    }

    // Forward the Range header so pdf.js can request byte ranges.
    const rangeHeader = request.headers.get('range')
    const upstreamHeaders: HeadersInit = {
      'Accept-Encoding': 'identity', // keep byte ranges accurate
    }
    if (rangeHeader) {
      upstreamHeaders['Range'] = rangeHeader
    }

    const upstream = await fetch(fileUrl, {
      headers: upstreamHeaders,
      signal: request.signal,
    })

    if (!upstream.ok && upstream.status !== 206) {
      console.error('[pdf-proxy] upstream error', upstream.status, fileUrl)
      return NextResponse.json(
        { error: `Upstream returned ${upstream.status}` },
        { status: upstream.status },
      )
    }

    const responseHeaders = new Headers()
    responseHeaders.set('Content-Type', 'application/pdf')
    responseHeaders.set('Accept-Ranges', 'bytes')
    responseHeaders.set('Cache-Control', 'public, max-age=3600')
    // Same-origin requests don't strictly need this, but it's harmless and
    // helps if the viewer is ever embedded from another origin.
    responseHeaders.set('Access-Control-Allow-Origin', '*')

    const contentLength = upstream.headers.get('content-length')
    if (contentLength) responseHeaders.set('Content-Length', contentLength)

    const contentRange = upstream.headers.get('content-range')
    if (contentRange) responseHeaders.set('Content-Range', contentRange)

    return new Response(upstream.body, {
      status: upstream.status, // 200 or 206
      headers: responseHeaders,
    })
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      return new Response(null, { status: 499 })
    }
    console.error('[pdf-proxy] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function HEAD(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fileUrl = searchParams.get('url')

    if (!fileUrl || !isAllowed(fileUrl)) {
      return new NextResponse(null, { status: fileUrl ? 403 : 400 })
    }

    const upstream = await fetch(fileUrl, { method: 'HEAD' })

    const headers = new Headers()
    headers.set('Content-Type', 'application/pdf')
    headers.set('Accept-Ranges', 'bytes')
    headers.set('Cache-Control', 'public, max-age=3600')

    const contentLength = upstream.headers.get('content-length')
    if (contentLength) headers.set('Content-Length', contentLength)

    return new NextResponse(null, { status: 200, headers })
  } catch (error) {
    console.error('[pdf-proxy] HEAD error:', error)
    return new NextResponse(null, { status: 500 })
  }
}
