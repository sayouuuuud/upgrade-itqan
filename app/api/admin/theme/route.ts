import { NextRequest, NextResponse } from "next/server"
import { getSession, isSuperAdmin } from "@/lib/auth"
import { query } from "@/lib/db"
import { clearSettingCache } from "@/lib/settings"
import { DEFAULT_THEME, normalizeTheme } from "@/lib/admin/theme"

const KEY = "theme_config"

// GET /api/admin/theme — current theme (defaults when unset).
export async function GET() {
  const session = await getSession()
  if (!isSuperAdmin(session)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
  }

  const rows = await query<{ setting_value: any }>(
    `SELECT setting_value FROM system_settings WHERE setting_key = $1`,
    [KEY]
  )
  const theme = rows.length ? normalizeTheme(rows[0].setting_value) : DEFAULT_THEME
  return NextResponse.json({ theme })
}

// PUT /api/admin/theme — persist a new theme (validated/normalized first).
export async function PUT(req: NextRequest) {
  const session = await getSession()
  if (!isSuperAdmin(session)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const theme = normalizeTheme(body?.theme)

  await query(
    `INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public, updated_by, updated_at)
     VALUES ($1, $2::jsonb, 'theme', 'Global design tokens', true, $3, NOW())
     ON CONFLICT (setting_key) DO UPDATE
        SET setting_value = EXCLUDED.setting_value,
            updated_by    = EXCLUDED.updated_by,
            updated_at    = NOW()`,
    [KEY, JSON.stringify(theme), session!.sub]
  )
  clearSettingCache(KEY)

  return NextResponse.json({ ok: true, theme })
}
