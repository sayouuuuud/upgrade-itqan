import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

/**
 * GET /api/homepage
 *
 * Public, unauthenticated endpoint that powers the live homepage
 * (`app/page.tsx`). Returns the homepage settings + maintenance flags from
 * `system_settings`. The companion admin endpoint at
 * `/api/admin/homepage` is what writes these values.
 */
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const rows = await query(
      `SELECT setting_key, setting_value
         FROM system_settings
        WHERE setting_type = 'homepage'`,
    )
    const settings: Record<string, any> = {}
    for (const r of rows as Array<{ setting_key: string; setting_value: any }>) {
      settings[r.setting_key] = r.setting_value
    }
    return NextResponse.json(
      { settings },
      {
        headers: {
          // Prevent stale CDN responses so admin edits show up immediately.
          'Cache-Control': 'no-store, max-age=0, must-revalidate',
        },
      },
    )
  } catch (e: any) {
    // Public endpoint: never leak details, just fall back to empty settings.
    console.error('[GET /api/homepage] error:', e?.message)
    return NextResponse.json({ settings: {} })
  }
}
