import { NextRequest, NextResponse } from 'next/server'
import { getSession, isSuperAdmin } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET() {
    try {
        const session = await getSession()
        if (!session || !isSuperAdmin(session)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const rows = await query(
            `SELECT setting_key, setting_value FROM system_settings
       WHERE setting_type = 'homepage' ORDER BY setting_key`
        )
        const settings: Record<string, any> = {}
        for (const r of rows as any[]) {
            settings[r.setting_key] = r.setting_value
        }
        return NextResponse.json({ settings })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

export async function PUT(req: NextRequest) {
    try {
        const session = await getSession()
        if (!session || !isSuperAdmin(session)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { settings } = await req.json()
        if (!settings || typeof settings !== 'object') {
            return NextResponse.json({ error: 'Missing settings' }, { status: 400 })
        }

        let count = 0
        for (const [key, value] of Object.entries(settings)) {
            // Skip undefined values — JSON.stringify(undefined) === "undefined",
            // which is invalid JSON for a jsonb column and would abort the save.
            if (value === undefined) continue
            await query(
                `INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public)
         VALUES ($1::text, $2::jsonb, 'homepage', $3::text, true)
         ON CONFLICT (setting_key) DO UPDATE SET setting_value = $2::jsonb, updated_at = NOW()`,
                [key, JSON.stringify(value), key]
            )
            count++
        }
        return NextResponse.json({ ok: true, count })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
