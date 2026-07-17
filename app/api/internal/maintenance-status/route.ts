import { NextResponse } from "next/server"
import { getSetting } from "@/lib/settings"

export type MaintenanceScope = "site" | "academy" | "maqraah"

/**
 * GET /api/internal/maintenance-status
 *
 * Returns:
 *   { enabled: boolean, scope: MaintenanceScope, message: string }
 *
 * - enabled: whether maintenance mode is on
 * - scope:   which part of the site is in maintenance
 *             "site"    → entire site (all platforms)
 *             "academy" → only /academy/*
 *             "maqraah" → only /reader /student /maqraah*
 *
 * Intentionally unauthenticated — called from middleware on every request.
 * Setting keys are the new unified ones written by the super-admin settings page.
 */
export async function GET() {
  try {
    const rawEnabled = await getSetting<boolean | string>("maintenance_enabled", false)
    const enabled    = rawEnabled === true || String(rawEnabled) === "true"

    const scope = await getSetting<MaintenanceScope>("maintenance_scope", "site")
    const message = await getSetting<string>(
      "maintenance_message",
      "المنصة تحت الصيانة حالياً، نعود قريباً بإذن الله."
    )

    return NextResponse.json(
      { enabled, scope: scope ?? "site", message },
      {
        headers: {
          "Cache-Control": "s-maxage=20, stale-while-revalidate=10",
        },
      }
    )
  } catch {
    return NextResponse.json({ enabled: false, scope: "site", message: "" })
  }
}
