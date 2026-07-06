import { NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query } from "@/lib/db"
import { clearSettingCache } from "@/lib/settings"
import { makeEnvelope, parseBackup } from "@/lib/admin/backup"

// Keys that belong to the settings backup: all maqraah_* plus the system keys.
const SYSTEM_KEYS = [
  "app_url",
  "smtp_config",
  "storage_config",
  "branding",
  "contact_info",
  "reader_assignment_strategy",
]

const SELECT_WHERE = `setting_key LIKE 'maqraah_%' OR setting_key IN ('app_url', 'smtp_config', 'storage_config', 'branding', 'contact_info', 'reader_assignment_strategy')`

function isAllowedKey(key: string): boolean {
  return key.startsWith("maqraah_") || SYSTEM_KEYS.includes(key)
}

// GET /api/admin/settings/backup — export settings as a signed envelope.
export async function GET() {
  const session = await getSession()
  if (!session || !requireRole(session, ["admin"])) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  try {
    const rows = await query<any>(
      `SELECT setting_key, setting_value, setting_type, updated_at
         FROM system_settings
        WHERE ${SELECT_WHERE}
        ORDER BY setting_key`
    )

    const settings: Record<string, any> = {}
    for (const row of rows) {
      let value = row.setting_value
      // Mask SMTP password so credentials never leave the server in plaintext.
      if (row.setting_key === "smtp_config" && value && typeof value === "object") {
        value = { ...value }
        if (value.password) value.password = "********"
      }
      settings[row.setting_key] = {
        value,
        type: row.setting_type,
        updatedAt: row.updated_at,
      }
    }

    const envelope = makeEnvelope(
      "settings",
      { settings },
      { count: Object.keys(settings).length, generated_by: session.sub }
    )

    const filename = `itqan-settings-backup-${new Date().toISOString().split("T")[0]}.json`

    return new NextResponse(JSON.stringify(envelope, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error: any) {
    console.error("[Settings backup] Export error:", error)
    return NextResponse.json(
      { error: "فشل في إنشاء النسخة الاحتياطية", details: error?.message },
      { status: 500 }
    )
  }
}

// POST /api/admin/settings/backup — import a settings backup (applied immediately).
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || !requireRole(session, ["admin"])) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const raw = typeof body.raw === "string" ? body.raw : JSON.stringify(body.file ?? {})
    const parsed = parseBackup<{ settings: Record<string, any> }>(raw, "settings")

    if (!parsed.ok) {
      return NextResponse.json(
        { error: "INVALID_BACKUP", reason: parsed.reason, detectedKind: parsed.detectedKind },
        { status: 400 }
      )
    }

    const incoming = parsed.payload?.settings ?? {}
    let applied = 0
    const skipped: string[] = []

    for (const [key, entry] of Object.entries(incoming)) {
      if (!isAllowedKey(key)) {
        skipped.push(key)
        continue
      }

      const type = (entry as any)?.type ?? "general"
      let value = (entry as any)?.value

      // Preserve the existing SMTP password when the backup carries a masked one.
      if (key === "smtp_config" && value && typeof value === "object") {
        const incomingCfg: any = { ...value }
        if (
          incomingCfg.password === "********" ||
          incomingCfg.password === "" ||
          incomingCfg.password == null
        ) {
          const existing = await query<{ setting_value: any }>(
            `SELECT setting_value FROM system_settings WHERE setting_key = 'smtp_config'`
          )
          const prev = existing?.[0]?.setting_value?.password
          if (prev) incomingCfg.password = prev
          else delete incomingCfg.password
        }
        value = incomingCfg
      }

      await query(
        `INSERT INTO system_settings (setting_key, setting_value, setting_type, updated_by, updated_at)
         VALUES ($1, $2::jsonb, $3, $4, NOW())
         ON CONFLICT (setting_key) DO UPDATE
            SET setting_value = EXCLUDED.setting_value,
                setting_type  = EXCLUDED.setting_type,
                updated_by    = EXCLUDED.updated_by,
                updated_at    = NOW()`,
        [key, JSON.stringify(value), type, session.sub]
      )
      clearSettingCache(key)
      applied++
    }

    // Apply immediately across the app.
    const { revalidatePath } = await import("next/cache")
    revalidatePath("/", "layout")

    await query(
      `INSERT INTO activity_logs (user_id, action, description) VALUES ($1, 'settings_restored', 'Admin imported settings backup')`,
      [session.sub]
    ).catch(() => { })

    return NextResponse.json({
      ok: true,
      message: `تم استيراد الإعدادات بنجاح (${applied} إعداد)`,
      applied,
      skipped,
    })
  } catch (error: any) {
    console.error("[Settings backup] Import error:", error)
    return NextResponse.json({ error: `فشل الاستيراد: ${error.message}` }, { status: 500 })
  }
}
