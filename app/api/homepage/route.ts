import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * GET /api/homepage
 *
 * Public, unauthenticated endpoint that powers the live homepage
 * (`app/page.tsx`). Returns the homepage settings from `system_settings` via
 * Supabase client. The admin endpoint at `/api/admin/homepage` writes these values.
 */
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[GET /api/homepage] Missing Supabase env vars')
      return NextResponse.json({ settings: {} })
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const { data: rows, error } = await supabase
      .from('system_settings')
      .select('setting_key, setting_value')
      .eq('setting_type', 'homepage')

    if (error) {
      console.error('[GET /api/homepage] Supabase error:', error.message)
      return NextResponse.json({ settings: {} })
    }

    const settings: Record<string, any> = {}
    if (rows) {
      for (const r of rows) {
        settings[r.setting_key] = r.setting_value
      }
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
    console.error('[GET /api/homepage] error:', e?.message)
    return NextResponse.json({ settings: {} })
  }
}
