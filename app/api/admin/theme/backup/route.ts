import { NextRequest, NextResponse } from "next/server"
import { getSession, isSuperAdmin } from "@/lib/auth"
import { query } from "@/lib/db"
import { clearSettingCache } from "@/lib/settings"
import { DEFAULT_THEME, normalizeTheme } from "@/lib/admin/theme"
import { makeEnvelope, parseBackup } from "@/lib/admin/backup"

const KEY = "theme_config"

// GET /api/admin/theme/backup — export the current theme as a signed envelope.
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
  const envelope = makeEnvelope("theme", { theme })

  const filename = `itqan-theme-backup-${new Date().toISOString().split("T")[0]}.json`
  return new NextResponse(JSON.stringify(envelope, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}

// POST /api/admin/theme/backup — import a theme backup (applied immediately).
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!isSuperAdmin(session)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const raw = typeof body.raw === "string" ? body.raw : JSON.stringify(body.file ?? {})
    const parsed = parseBackup<{ theme: any }>(raw, "theme")

    if (!parsed.ok) {
      return NextResponse.json(
        { error: "INVALID_BACKUP", reason: parsed.reason, detectedKind: parsed.detectedKind },
        { status: 400 }
      )
    }

    // normalizeTheme coerces any malformed data into a safe, valid theme so a
    // bad file can never inject broken CSS.
    const theme = normalizeTheme(parsed.payload?.theme)

    await query(
      `INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public, updated_by, updated_at)
       VALUES ($1, $2::jsonb, 'general', 'Global design tokens', true, $3, NOW())
       ON CONFLICT (setting_key) DO UPDATE
          SET setting_value = EXCLUDED.setting_value,
              updated_by    = EXCLUDED.updated_by,
              updated_at    = NOW()`,
      [KEY, JSON.stringify(theme), session!.sub]
    )
    clearSettingCache(KEY)

    // Apply immediately — ThemeStyleInjector re-reads on next render.
    const { revalidatePath } = await import("next/cache")
    revalidatePath("/", "layout")

    return NextResponse.json({
      ok: true,
      message: "تم استيراد الثيم بنجاح وتطبيقه فوراً",
      theme,
    })
  } catch (error: any) {
    console.error("[Theme backup] Import error:", error)
    return NextResponse.json({ error: `فشل الاستيراد: ${error.message}` }, { status: 500 })
  }
}
