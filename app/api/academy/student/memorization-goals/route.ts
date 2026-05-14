import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"
import { getWeekStart, type MemorizationGoal } from "@/lib/memorization-goals"

/**
 * GET  /api/academy/student/memorization-goals
 *   ?week=YYYY-MM-DD        – returns the goal for that week (or null)
 *   ?range=4                – returns the last N weeks of goals (default: 4)
 *
 * POST /api/academy/student/memorization-goals
 *   { week?, surah_from, ayah_from, surah_to, ayah_to, target_verses, notes }
 *   Self-sets / updates the student's goal for `week` (defaults to current
 *   week).  If the student already has a goal for that week it is updated
 *   in place.  Teachers must use the teacher endpoint instead.
 */

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const weekParam = searchParams.get("week")
    const rangeParam = parseInt(searchParams.get("range") || "0", 10)

    if (rangeParam > 0 && rangeParam <= 26) {
      // Last N weeks of history
      const goals = await query<MemorizationGoal>(
        `SELECT * FROM memorization_goals
         WHERE student_id = $1
         ORDER BY week_start DESC
         LIMIT $2`,
        [session.sub, rangeParam],
      )
      return NextResponse.json({ goals })
    }

    const week = weekParam || getWeekStart(new Date())
    const rows = await query<MemorizationGoal>(
      `SELECT * FROM memorization_goals
       WHERE student_id = $1 AND week_start = $2
       LIMIT 1`,
      [session.sub, week],
    )

    return NextResponse.json({
      week_start: week,
      goal: rows[0] || null,
    })
  } catch (err) {
    console.error("[API] memorization-goals GET error:", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const week = body.week ? getWeekStart(body.week) : getWeekStart(new Date())

    const surahFrom = body.surah_from ?? null
    const ayahFrom = body.ayah_from ?? null
    const surahTo = body.surah_to ?? null
    const ayahTo = body.ayah_to ?? null
    const targetVerses = Math.max(0, parseInt(body.target_verses || "0", 10) || 0)
    const notes = (body.notes || "").toString().slice(0, 2000) || null

    const rows = await query<MemorizationGoal>(
      `INSERT INTO memorization_goals (
         student_id, set_by, week_start,
         surah_from, ayah_from, surah_to, ayah_to,
         target_verses, notes, status
       )
       VALUES ($1, $1, $2, $3, $4, $5, $6, $7, $8, 'active')
       ON CONFLICT (student_id, week_start) DO UPDATE SET
         set_by        = EXCLUDED.set_by,
         surah_from    = EXCLUDED.surah_from,
         ayah_from     = EXCLUDED.ayah_from,
         surah_to      = EXCLUDED.surah_to,
         ayah_to       = EXCLUDED.ayah_to,
         target_verses = EXCLUDED.target_verses,
         notes         = EXCLUDED.notes,
         status        = CASE
           WHEN memorization_goals.status = 'completed' THEN 'completed'
           ELSE 'active'
         END,
         updated_at    = NOW()
       RETURNING *`,
      [session.sub, week, surahFrom, ayahFrom, surahTo, ayahTo, targetVerses, notes],
    )

    return NextResponse.json({ goal: rows[0] })
  } catch (err: any) {
    console.error("[API] memorization-goals POST error:", err)
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 },
    )
  }
}
