import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"
import { getActiveParentChildLink } from "@/lib/academy/parent-controls"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession()
  if (!session || session.role !== "parent") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  try {
    const { id: childId } = await params
    const link = await getActiveParentChildLink(session.sub, childId)
    if (!link) {
      return NextResponse.json({ error: "غير مصرح لهذا الابن" }, { status: 403 })
    }

    const [recitations, sessions, badges] = await Promise.all([
      query(
        `SELECT r.id,
                r.surah_name,
                r.surah_number,
                r.ayah_from,
                r.ayah_to,
                r.recitation_type,
                r.status,
                r.created_at,
                r.reviewed_at,
                rd.name AS reader_name,
                rv.overall_score,
                rv.verdict,
                rv.detailed_feedback
           FROM recitations r
           LEFT JOIN users rd ON rd.id = r.assigned_reader_id
           LEFT JOIN reviews rv ON rv.recitation_id = r.id
          WHERE r.student_id = $1
          ORDER BY r.created_at DESC
          LIMIT 50`,
        [childId],
      ),
      query(
        `SELECT b.id,
                b.status,
                b.scheduled_at,
                b.slot_start,
                b.slot_end,
                b.duration_minutes,
                b.session_summary,
                b.reader_notes,
                r.name AS teacher_name
           FROM bookings b
           LEFT JOIN users r ON r.id = b.reader_id
          WHERE b.student_id = $1
          ORDER BY COALESCE(b.slot_start, b.scheduled_at, b.created_at) DESC
          LIMIT 50`,
        [childId],
      ),
      query(
        `SELECT id,
                badge_type,
                badge_name,
                badge_description,
                badge_icon_url,
                points_awarded,
                COALESCE(awarded_at, earned_at) AS earned_at
           FROM badges
          WHERE user_id = $1
          ORDER BY COALESCE(awarded_at, earned_at) DESC
          LIMIT 50`,
        [childId],
      ),
    ])

    return NextResponse.json({ recitations, sessions, badges })
  } catch (error) {
    console.error("[API] parent child activity error:", error)
    return NextResponse.json({ error: "حدث خطأ داخلي" }, { status: 500 })
  }
}
