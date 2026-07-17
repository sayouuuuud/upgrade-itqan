import { NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query } from "@/lib/db"
import { clearSettingCache } from "@/lib/settings"

/**
 * Academy Settings API (Academy Admin Only)
 *
 * GET: Retrieve all academy_* settings (courses, registration, sessions, gamification, forum, notifications, etc.)
 * PUT: Update academy_* settings
 *
 * NEVER returns system_* or maqraah_* keys
 * Does NOT include general/security/maintenance (those are system-wide)
 */

// Validate setting key belongs to academy namespace
function validateAcademyKey(key: string): boolean {
  const academyPrefixes = [
    "academy_general_",
    "academy_registration_",
    "academy_courses_",
    "academy_sessions_",
    "academy_gamification_",
    "academy_notifications_",
    "academy_forum_",
  ]
  return academyPrefixes.some((prefix) => key.startsWith(prefix))
}

export async function GET() {
  const session = await getSession()
  if (!session || !requireRole(session, ["academy_admin"])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const settings = await query(
      `SELECT setting_key, setting_value, setting_type, updated_at, u.name AS modified_by
       FROM system_settings s
       LEFT JOIN users u ON u.id = s.updated_by
       WHERE s.setting_key LIKE 'academy_%'
       ORDER BY s.setting_type, s.setting_key`
    )

    const grouped = settings.reduce(
      (acc: Record<string, any>, row: any) => {
        const type = row.setting_type
        if (!acc[type]) acc[type] = []
        acc[type].push(row)
        return acc
      },
      {}
    )

    return NextResponse.json({ settings, grouped })
  } catch (error) {
    console.error("[API] academy/admin/settings GET error:", error)
    return NextResponse.json(
      { error: "Failed to fetch academy settings" },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  const session = await getSession()
  if (!session || !requireRole(session, ["academy_admin"])) {
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
      // Only allow academy_* keys
      if (!validateAcademyKey(key)) {
        rejectedKeys.push(key)
        continue
      }

      // Extract setting type from key (e.g., academy_courses_xxx → academy_courses)
      const typeParts = key.split("_").slice(0, 2)
      const settingType = typeParts.join("_")

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
        warning: "Some keys were rejected (not academy_*)",
        rejectedKeys,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API] academy/admin/settings PUT error:", error)
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    )
  }
}
