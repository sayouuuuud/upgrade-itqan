import { NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query } from "@/lib/db"
import { clearSettingCache } from "@/lib/settings"
import { isSystemKey, systemTypeForKey } from "@/app/admin/settings/_lib/system-keys"

/**
 * System Settings API (Super Admin only)
 *
 * GET: returns every row whose setting_type is system_* (identity, email,
 *      security, notifications, maintenance, seo, storage).
 * PUT: updates only keys present in SYSTEM_KEY_TYPES.
 *
 * NEVER touches academy_* or maqraah_* settings.
 */

export async function GET() {
  const session = await getSession()
  if (!session || !requireRole(session, ["admin"])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const settings = await query(
      `SELECT s.setting_key, s.setting_value, s.setting_type, s.updated_at, u.name AS modified_by
       FROM system_settings s
       LEFT JOIN users u ON u.id = s.updated_by
       WHERE s.setting_type LIKE 'system_%'
       ORDER BY s.setting_type, s.setting_key`
    )

    return NextResponse.json({ settings })
  } catch (error) {
    console.error("[API] system/settings GET error:", error)
    return NextResponse.json(
      { error: "Failed to fetch system settings" },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  const session = await getSession()
  if (!session || !requireRole(session, ["admin"])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const settings = body?.settings

    if (!settings || typeof settings !== "object") {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 })
    }

    const rejectedKeys: string[] = []

    for (const [key, value] of Object.entries(settings)) {
      if (!isSystemKey(key)) {
        rejectedKeys.push(key)
        continue
      }

      const settingType = systemTypeForKey(key)!

      await query(
        `INSERT INTO system_settings (setting_key, setting_value, setting_type, updated_by, updated_at)
         VALUES ($1, $2::jsonb, $3, $4, NOW())
         ON CONFLICT (setting_key) DO UPDATE
            SET setting_value = EXCLUDED.setting_value,
                setting_type = EXCLUDED.setting_type,
                updated_by = EXCLUDED.updated_by,
                updated_at = NOW()`,
        [key, JSON.stringify(value), settingType, session.sub]
      )
      clearSettingCache(key)
    }

    if (rejectedKeys.length > 0) {
      return NextResponse.json({
        success: true,
        warning: "بعض المفاتيح خارج نطاق النظام وتم تجاهلها",
        rejectedKeys,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API] system/settings PUT error:", error)
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    )
  }
}
