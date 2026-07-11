import { NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query } from "@/lib/db"
import { clearSettingCache } from "@/lib/settings"

const SYSTEM_SETTING_TYPES: Record<string, string> = {
  system_name: "general",
  system_description: "general",
  system_timezone: "general",
  system_language: "general",
  app_url: "general",
  branding: "general",
  contact_info: "general",
  social_links: "general",
  system_maintenance: "general",
  system_security: "general",
  system_privacy: "general",
  system_notifications: "general",
  smtp_config: "smtp",
  storage_config: "storage",
}

const SYSTEM_KEYS = Object.keys(SYSTEM_SETTING_TYPES)

export async function GET() {
  const session = await getSession()
  if (!session || !requireRole(session, ["admin"])) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  try {
    const rows = await query(
      `SELECT s.setting_key, s.setting_value, s.setting_type, s.updated_at,
              u.name AS modified_by_name
         FROM system_settings s
         LEFT JOIN users u ON u.id = s.updated_by
        WHERE s.setting_key = ANY($1::text[])
        ORDER BY s.setting_key`,
      [SYSTEM_KEYS]
    )

    const settings = rows.reduce((result: Record<string, unknown>, row: any) => {
      let value = row.setting_value
      if (row.setting_key === "smtp_config" && value && typeof value === "object") {
        value = { ...value, password: value.password ? "********" : "" }
      }
      result[row.setting_key] = {
        value,
        type: row.setting_type,
        updatedAt: row.updated_at,
        modifiedBy: row.modified_by_name,
      }
      return result
    }, {})

    return NextResponse.json({ settings })
  } catch (error) {
    console.error("[System Settings] GET error:", error)
    return NextResponse.json({ error: "فشل في جلب إعدادات النظام" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const session = await getSession()
  if (!session || !requireRole(session, ["admin"])) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const settings = body?.settings
    if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
      return NextResponse.json({ error: "بيانات غير صحيحة" }, { status: 400 })
    }

    const rejectedKeys = Object.keys(settings).filter((key) => !SYSTEM_SETTING_TYPES[key])
    if (rejectedKeys.length > 0) {
      return NextResponse.json({ error: "توجد مفاتيح لا تخص إعدادات النظام", rejectedKeys }, { status: 400 })
    }

    for (const [key, rawValue] of Object.entries(settings)) {
      let value = rawValue
      if (key === "smtp_config" && rawValue && typeof rawValue === "object") {
        const incoming = { ...(rawValue as Record<string, unknown>) }
        if (!incoming.password || incoming.password === "********") {
          const existing = await query<{ setting_value: Record<string, unknown> }>(
            "SELECT setting_value FROM system_settings WHERE setting_key = 'smtp_config'"
          )
          const password = existing[0]?.setting_value?.password
          if (password) incoming.password = password
          else delete incoming.password
        }
        value = incoming
      }

      await query(
        `INSERT INTO system_settings (setting_key, setting_value, setting_type, updated_by, updated_at)
         VALUES ($1, $2::jsonb, $3, $4, NOW())
         ON CONFLICT (setting_key) DO UPDATE
           SET setting_value = EXCLUDED.setting_value,
               setting_type = EXCLUDED.setting_type,
               updated_by = EXCLUDED.updated_by,
               updated_at = NOW()`,
        [key, JSON.stringify(value), SYSTEM_SETTING_TYPES[key], session.sub]
      )
      clearSettingCache(key)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[System Settings] PUT error:", error)
    return NextResponse.json({ error: "فشل في حفظ إعدادات النظام" }, { status: 500 })
  }
}
