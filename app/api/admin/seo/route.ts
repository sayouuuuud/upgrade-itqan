import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET() {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rows = await query(
        `SELECT setting_key, setting_value FROM system_settings
     WHERE setting_type IN ('seo') ORDER BY setting_key`
    )

    const settings: Record<string, any> = {}
    for (const r of rows as any[]) {
        settings[r.setting_key] = r.setting_value
    }

    return NextResponse.json({ settings })
}

export async function PUT(req: NextRequest) {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { settings } = await req.json()
    if (!settings) return NextResponse.json({ error: 'Missing settings' }, { status: 400 })

    for (const [key, value] of Object.entries(settings)) {
        await query(
            `INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public)
       VALUES ($1::varchar, $2::jsonb, 'seo', $1::text, true)
       ON CONFLICT (setting_key) DO UPDATE SET setting_value = $2::jsonb, updated_at = NOW()`,
            [key, JSON.stringify(value)]
        )
    }

    return NextResponse.json({ ok: true })
}
