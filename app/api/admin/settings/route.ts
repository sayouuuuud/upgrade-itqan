import { NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query } from "@/lib/db"
import { clearSettingCache } from "@/lib/settings"

const MAQRAAH_SETTING_PREFIXES = [
  "maqraah_readers_",
  "maqraah_halaqat_",
  "maqraah_recitations_",
  "maqraah_paths_",
  "maqraah_points_",
  "maqraah_competitions_",
] as const

function resolveSettingType(key: string): string | null {
  const prefix = MAQRAAH_SETTING_PREFIXES.find((candidate) => key.startsWith(candidate))
  return prefix ? prefix.slice(0, -1) : null
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
        WHERE ${MAQRAAH_SETTING_PREFIXES.map((_, index) => `s.setting_key LIKE $${index + 1}`).join(" OR ")}
        ORDER BY s.setting_key`,
      MAQRAAH_SETTING_PREFIXES.map((prefix) => `${prefix}%`)
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

      await query(
        `INSERT INTO system_settings (setting_key, setting_value, setting_type, updated_by, updated_at)
         VALUES ($1, $2::jsonb, $3, $4, NOW())
         ON CONFLICT (setting_key) DO UPDATE
            SET setting_value = EXCLUDED.setting_value,
                setting_type  = EXCLUDED.setting_type,
                updated_by    = EXCLUDED.updated_by,
                updated_at    = NOW()`,
        [key, JSON.stringify(value), settingType, session.sub]
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
