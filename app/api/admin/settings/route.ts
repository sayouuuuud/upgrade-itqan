import { NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query } from "@/lib/db"
import { clearSettingCache } from "@/lib/settings"

// Cross-cutting / system-wide keys owned by the maqraah "system" tab.
const SYSTEM_KEYS: Record<string, string> = {
  app_url: "general",
  smtp_config: "smtp",
  storage_config: "storage",
  branding: "general",
  contact_info: "general",
  social_links: "general",
  reader_assignment_strategy: "general",
}

// Resolve the setting_type bucket for any supported key. Returns null for
// unknown keys so they can be rejected instead of polluting the table.
function resolveSettingType(key: string): string | null {
  if (SYSTEM_KEYS[key]) return SYSTEM_KEYS[key]
  if (key.startsWith("maqraah_general_")) return "maqraah_general"
  if (key.startsWith("maqraah_readers_")) return "maqraah_readers"
  if (key.startsWith("maqraah_halaqat_")) return "maqraah_halaqat"
  if (key.startsWith("maqraah_recitations_")) return "maqraah_recitations"
  if (key.startsWith("maqraah_paths_")) return "maqraah_paths"
  if (key.startsWith("maqraah_points_")) return "maqraah_points"
  if (key.startsWith("maqraah_competitions_")) return "maqraah_competitions"
  if (key.startsWith("maqraah_notifications_")) return "maqraah_notifications"
  if (key.startsWith("maqraah_security_")) return "maqraah_security"
  if (key.startsWith("maqraah_maintenance_")) return "maqraah_maintenance"
  return null
}

// GET /api/admin/settings
export async function GET() {
  const session = await getSession()
  if (!session || !requireRole(session, ["admin"])) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  try {
    const settings = await query(
      `SELECT s.setting_key,
              s.setting_value,
              s.setting_type,
              s.updated_at,
              u.name AS modified_by_name
         FROM system_settings s
         LEFT JOIN users u ON u.id = s.updated_by
        WHERE s.setting_key LIKE 'maqraah_%'
           OR s.setting_key IN ('app_url', 'smtp_config', 'storage_config', 'branding', 'contact_info', 'social_links', 'reader_assignment_strategy')
        ORDER BY s.setting_key`
    )

    const settingsMap = settings.reduce((acc: Record<string, any>, row: any) => {
      let value = row.setting_value
      // Mask sensitive credentials in GET responses
      if (row.setting_key === "smtp_config" && value && typeof value === "object") {
        value = { ...value }
        if (value.password) value.password = "********"
      }
      acc[row.setting_key] = {
        value,
        type: row.setting_type,
        updatedAt: row.updated_at,
        modifiedBy: row.modified_by_name,
      }
      return acc
    }, {})

    return NextResponse.json({ settings: settingsMap })
  } catch (error) {
    console.error("[Maqraah Settings] GET error:", error)
    return NextResponse.json({ error: "فشل في جلب الإعدادات" }, { status: 500 })
  }
}

// PUT /api/admin/settings
export async function PUT(req: NextRequest) {
  const session = await getSession()
  if (!session || !requireRole(session, ["admin"])) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const settings = body?.settings

    if (!settings || typeof settings !== "object") {
      return NextResponse.json({ error: "بيانات غير صحيحة" }, { status: 400 })
    }

    const rejectedKeys: string[] = []

    for (const [key, value] of Object.entries(settings)) {
      const settingType = resolveSettingType(key)
      if (!settingType) {
        rejectedKeys.push(key)
        continue
      }

      let valueToStore: any = value

      // smtp_config: preserve existing password if masked/empty
      if (key === "smtp_config" && value && typeof value === "object") {
        const incoming: any = { ...(value as any) }
        if (incoming.password === "********" || incoming.password === "" || incoming.password == null) {
          const existing = await query<{ setting_value: any }>(
            `SELECT setting_value FROM system_settings WHERE setting_key = 'smtp_config'`
          )
          const prevPassword = existing?.[0]?.setting_value?.password
          if (prevPassword) incoming.password = prevPassword
          else delete incoming.password
        }
        valueToStore = incoming
      }

      await query(
        `INSERT INTO system_settings (setting_key, setting_value, setting_type, updated_by, updated_at)
         VALUES ($1, $2::jsonb, $3, $4, NOW())
         ON CONFLICT (setting_key) DO UPDATE
            SET setting_value = EXCLUDED.setting_value,
                setting_type  = EXCLUDED.setting_type,
                updated_by    = EXCLUDED.updated_by,
                updated_at    = NOW()`,
        [key, JSON.stringify(valueToStore), settingType, session.sub]
      )
      clearSettingCache(key)
    }

    if (rejectedKeys.length > 0) {
      return NextResponse.json({
        success: true,
        warning: "بعض المفاتيح غير معروفة وتم تجاهلها",
        rejectedKeys,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Maqraah Settings] PUT error:", error)
    return NextResponse.json({ error: "فشل في حفظ الإعدادات" }, { status: 500 })
  }
}
