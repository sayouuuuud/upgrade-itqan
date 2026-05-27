import { NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query } from "@/lib/db"
import { clearSettingCache } from "@/lib/settings"

// GET /api/academy/admin/settings
export async function GET() {
  const session = await getSession()
  if (!session || !requireRole(session, ["admin", "academy_admin"])) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  try {
    const settings = await query(
      `SELECT setting_key, setting_value, setting_type, updated_at, 
              (SELECT name FROM users WHERE id::text = last_modified_by LIMIT 1) as modified_by_name
       FROM system_settings 
       WHERE setting_key LIKE 'academy_%' OR setting_key IN ('app_url', 'smtp_config', 'storage_config')
       ORDER BY setting_key`
    )

    const settingsMap = settings.reduce((acc, row: any) => {
      acc[row.setting_key] = {
        value: row.setting_value,
        type: row.setting_type,
        updatedAt: row.updated_at,
        modifiedBy: row.modified_by_name
      }
      return acc
    }, {} as Record<string, any>)

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
    const { settings } = await req.json()

    if (!settings || typeof settings !== "object") {
      return NextResponse.json({ error: "بيانات غير صحيحة" }, { status: 400 })
    }

    // Update each setting provided
    for (const [key, value] of Object.entries(settings)) {
      const settingType = getSettingType(key)
      
      await query(
        `INSERT INTO system_settings (setting_key, setting_value, setting_type, last_modified_by, updated_at)
         VALUES ($1, $2::jsonb, $3, $4, NOW())
         ON CONFLICT (setting_key) DO UPDATE
         SET setting_value = $2::jsonb, 
             setting_type = $3,
             last_modified_by = $4,
             updated_at = NOW()`,
        [key, JSON.stringify(value), settingType, session.sub]
      )
      clearSettingCache(key)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Academy Settings] PUT error:", error)
    return NextResponse.json({ error: "فشل في حفظ الإعدادات" }, { status: 500 })
  }
}

function getSettingType(key: string): string {
  if (key.startsWith('academy_general_')) return 'academy_general'
  if (key.startsWith('academy_registration_')) return 'academy_registration'
  if (key.startsWith('academy_courses_')) return 'academy_courses'
  if (key.startsWith('academy_sessions_')) return 'academy_sessions'
  if (key.startsWith('academy_gamification_')) return 'academy_gamification'
  if (key.startsWith('academy_notifications_')) return 'academy_notifications'
  if (key.startsWith('academy_forum_')) return 'academy_forum'
  if (key.startsWith('academy_security_')) return 'academy_security'
  if (key.startsWith('academy_maintenance_')) return 'academy_maintenance'
  if (key === 'smtp_config') return 'smtp'
  if (key === 'storage_config') return 'storage'
  return 'general'
}
