import { NextResponse } from "next/server"
import { getSetting } from "@/lib/settings"

// GET /api/internal/maintenance-status
// Returns maintenance mode status with 1-minute cache (via getSetting)
// This endpoint is intentionally unauthenticated — it is internal only
// and exposed under /api/internal which the middleware allows publicly.
export async function GET() {
  try {
    const enabled = await getSetting<boolean>("maqraah_maintenance_mode", false)
    const message = await getSetting<string>(
      "maqraah_maintenance_message",
      "المنصة تحت الصيانة حالياً، نعود قريباً بإذن الله."
    )

    return NextResponse.json(
      { enabled: enabled === true || String(enabled) === "true", message },
      {
        headers: {
          // Edge cache: re-use the response for 60 s before re-fetching from origin
          "Cache-Control": "s-maxage=60, stale-while-revalidate=30",
        },
      }
    )
  } catch {
    // On any DB error, report maintenance as OFF so the site keeps running
    return NextResponse.json({ enabled: false, message: "" })
  }
}
