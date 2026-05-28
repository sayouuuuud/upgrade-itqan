import { NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query } from "@/lib/db"
import { clearSettingCache } from "@/lib/settings"

// Map every supported academy setting key to its setting_type bucket so
// the DB CHECK constraint never fails. Keys not in this map are rejected
// to avoid polluting the system_settings table.
const SETTING_TYPE_MAP: Record<string, string> = {
  // Cross-cutting
  app_url: "general",
  smtp_config: "smtp",
  storage_config: "storage",
}

// All academy_* keys are bucketed by their prefix
function resolveSettingType(key: string): string | null {
  if (SETTING_TYPE_MAP[key]) return SETTING_TYPE_MAP[key]
  if (key.startsWith("academy_general_")) return "academy_general"
  if (key.startsWith("academy_registration_")) return "academy_registration"
  if (key.startsWith("academy_courses_")) return "academy_courses"
  if (key.startsWith("academy_sessions_")) return "academy_sessions"
  if (key.startsWith("academy_gamification_")) return "academy_gamification"
  if (key.startsWith("academy_notifications_")) return "academy_notifications"
  if (key.startsWith("academy_forum_")) return "academy_forum"
  if (key.startsWith("academy_security_")) return "academy_security"
  if (key.startsWith("academy_maintenance_")) return "academy_maintenance"
  return null
}

// GET /api/academy/admin/settings
export async function GET() {
  const session = await getSession()
  if (!session || !requireRole(session, ["admin", "academy_admin"])) {
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
        WHERE s.setting_key LIKE 'academy_%'
           OR s.setting_key IN ('app_url', 'smtp_config', 'storage_config')
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
    console.error("[Academy Settings] GET error:", error)
    return NextResponse.json({ error: "فشل في جلب الإعدادات" }, { status: 500 })
  }
}

// PUT /api/academy/admin/settings
export async function PUT(req: NextRequest) {
  const session = await getSession()
  if (!session || !requireRole(session, ["admin", "academy_admin"])) {
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

      // For smtp_config: if password is the masked sentinel, preserve the existing password
      if (key === "smtp_config" && value && typeof value === "object") {
        const incoming: any = { ...(value as any) }
        if (incoming.password === "********" || incoming.password === "" || incoming.password == null) {
          const existing = await query<{ setting_value: any }>(
            `SELECT setting_value FROM system_settings WHERE setting_key = 'smtp_config'`
          )
          const prevPassword = existing?.[0]?.setting_value?.password
          if (prevPassword) {
            incoming.password = prevPassword
          } else {
            delete incoming.password
          }
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
    console.error("[Academy Settings] PUT error:", error)
    return NextResponse.json({ error: "فشل في حفظ الإعدادات" }, { status: 500 })
  }
}
