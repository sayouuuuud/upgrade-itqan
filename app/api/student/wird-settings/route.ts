import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const rows = await query<{
    id: string
    fajr_reminder_enabled: boolean
    maghrib_reminder_enabled: boolean
    wird_items: any[]
    daily_goal_note: string | null
    updated_at: string
  }>(
    `SELECT id, fajr_reminder_enabled, maghrib_reminder_enabled, wird_items, daily_goal_note, updated_at
     FROM student_werd_settings
     WHERE student_id = $1`,
    [session.id]
  )

  if (rows.length === 0) {
    // Return sensible defaults without inserting yet
    return NextResponse.json({
      fajr_reminder_enabled: true,
      maghrib_reminder_enabled: true,
      wird_items: [],
      daily_goal_note: null,
    })
  }

  return NextResponse.json(rows[0])
}

export async function PUT(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const {
    fajr_reminder_enabled,
    maghrib_reminder_enabled,
    wird_items,
    daily_goal_note,
  } = body

  // Upsert
  const rows = await query<{ id: string }>(
    `INSERT INTO student_werd_settings
       (student_id, fajr_reminder_enabled, maghrib_reminder_enabled, wird_items, daily_goal_note)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (student_id) DO UPDATE SET
       fajr_reminder_enabled    = EXCLUDED.fajr_reminder_enabled,
       maghrib_reminder_enabled = EXCLUDED.maghrib_reminder_enabled,
       wird_items               = EXCLUDED.wird_items,
       daily_goal_note          = EXCLUDED.daily_goal_note,
       updated_at               = now()
     RETURNING id`,
    [
      session.id,
      fajr_reminder_enabled ?? true,
      maghrib_reminder_enabled ?? true,
      JSON.stringify(wird_items ?? []),
      daily_goal_note ?? null,
    ]
  )

  return NextResponse.json({ success: true, id: rows[0]?.id })
}
