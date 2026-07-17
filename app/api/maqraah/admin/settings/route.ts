import { NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query } from "@/lib/db"
import { clearSettingCache } from "@/lib/settings"

/**
 * Maqraah Settings API (Maqraah Admin Only)
 *
 * GET: Retrieve all maqraah_* settings (halaqat, readers, recitations, paths, points, competitions, notifications, etc.)
 * PUT: Update maqraah_* settings
 *
 * NEVER returns system_* or academy_* keys
 * Does NOT include general/security/maintenance (those are system-wide)
 */

// Validate setting key belongs to maqraah namespace
function validateMaqraahKey(key: string): boolean {
  const maqraahPrefixes = [
    "maqraah_general_",
    "maqraah_readers_",
    "maqraah_halaqat_",
    "maqraah_recitations_",
    "maqraah_paths_",
    "maqraah_points_",
    "maqraah_competitions_",
    "maqraah_notifications_",
  ]
  return maqraahPrefixes.some((prefix) => key.startsWith(prefix))
}

export async function GET() {
  const session = await getSession()
  if (!session || !requireRole(session, ["maqraa_admin"])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const settings = await query(
      `SELECT setting_key, setting_value, setting_type, updated_at, u.name AS modified_by
       FROM system_settings s
       LEFT JOIN users u ON u.id = s.updated_by
       WHERE s.setting_key LIKE 'maqraah_%'
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
    console.error("[API] maqraah/admin/settings GET error:", error)
    return NextResponse.json(
      { error: "Failed to fetch maqraah settings" },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  const session = await getSession()
  if (!session || !requireRole(session, ["maqraa_admin"])) {
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
      // Only allow maqraah_* keys
      if (!validateMaqraahKey(key)) {
        rejectedKeys.push(key)
        continue
      }

      // Extract setting type from key (e.g., maqraah_halaqat_xxx → maqraah_halaqat)
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
        warning: "Some keys were rejected (not maqraah_*)",
        rejectedKeys,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[API] maqraah/admin/settings PUT error:", error)
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    )
  }
}
