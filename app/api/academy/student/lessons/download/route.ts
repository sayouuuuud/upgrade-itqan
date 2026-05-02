import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
    const session = await getSession()
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const url = searchParams.get('url')
    const fileName = searchParams.get('name') || 'attachment'

    if (!url) {
        return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    try {
        console.log(`[Download Proxy] Attempting download for: ${url}`);

        // For cloudinary URLs, inject fl_attachment for proper download behavior
        let fetchUrl = url;
        if (url.includes('cloudinary.com') && url.includes('/upload/')) {
            fetchUrl = url.replace('/upload/', '/upload/fl_attachment/');
        }

        console.log(`[Download Proxy] Fetching: ${fetchUrl}`);
        const response = await fetch(fetchUrl)

        if (!response.ok) {
            console.error(`[Download Proxy] Fetch failed with status ${response.status}: ${response.statusText}`);
            throw new Error(`Failed to fetch file: ${response.statusText}`)
        }

        const contentType = response.headers.get('content-type') || 'application/octet-stream'
        const buffer = await response.arrayBuffer()

        console.log(`[Download Proxy] Successfully fetched file. Size: ${buffer.byteLength} bytes`);

        // Improve filename handling for Arabic and special characters
        const safeFileName = encodeURIComponent(fileName);
        
        return new NextResponse(buffer, {
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="${safeFileName}"; filename*=UTF-8''${safeFileName}`,
                'Cache-Control': 'no-cache',
            }
        })
    } catch (error) {
        console.error('[Download Proxy] Error:', error)
        return NextResponse.json({ error: 'فشل تحميل الملف' }, { status: 500 })
    }
}
