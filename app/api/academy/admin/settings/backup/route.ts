import { NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query } from "@/lib/db"

// GET /api/academy/admin/settings/backup
// Returns a JSON snapshot of all academy_* settings (with SMTP password masked)
export async function GET() {
  const session = await getSession()
  if (!session || !requireRole(session, ["admin", "academy_admin"])) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  try {
    const rows = await query<any>(
      `SELECT setting_key, setting_value, setting_type, updated_at
         FROM system_settings
        WHERE setting_key LIKE 'academy_%'
           OR setting_key IN ('app_url', 'smtp_config', 'storage_config')
        ORDER BY setting_key`
    )

    const settings: Record<string, any> = {}
    for (const row of rows) {
      let value = row.setting_value
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

    const backup = {
      timestamp: new Date().toISOString(),
      version: "1.0",
      generated_by: session.sub,
      settings,
    }

    const filename = `itqan-settings-backup-${new Date().toISOString().split("T")[0]}.json`

    return new NextResponse(JSON.stringify(backup, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error: any) {
    console.error("[backup] Error:", error)
    return NextResponse.json(
      { error: "فشل في إنشاء النسخة الاحتياطية", details: error?.message },
      { status: 500 }
    )
  }
}
