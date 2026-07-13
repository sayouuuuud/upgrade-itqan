import { NextResponse } from 'next/server'
import { getSession, isSuperAdmin } from '@/lib/auth'
import { query } from '@/lib/db'

/**
 * POST /api/admin/homepage/reset
 *
 * Deletes all homepage setting rows from system_settings so the public page
 * falls back to DEFAULT_HOMEPAGE_CONTENT defined in lib/homepage-content.ts.
 * Only super-admins may call this.
 */
export async function POST() {
  try {
    const session = await getSession()
    if (!session || !isSuperAdmin(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await query(
      `DELETE FROM system_settings WHERE setting_type = 'homepage'`
    ) as any

    const deleted = result?.rowCount ?? result?.length ?? 0
    return NextResponse.json({ ok: true, deleted })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
