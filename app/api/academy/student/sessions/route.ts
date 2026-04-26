import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
    const session = await getSession()
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        return NextResponse.json({ data: [] })
    } catch (error) {
        console.error('[API] Error fetching student sessions:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
