import { NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query } from "@/lib/db"

type StudentProgressRow = {
  student_id: string
  student_name: string
  student_email: string | null
  active_days_30: number
  week_new_verses: number
  week_revised_verses: number
  target_verses: number
  goal_status: string | null
  week_start: string | null
  last_activity_at: string | null
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session || !requireRole(session, ["reader"])) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    const rows = await query<StudentProgressRow>(
      `
        WITH reader_students AS (
          SELECT DISTINCT r.student_id
          FROM recitations r
          WHERE r.assigned_reader_id = $1

          UNION

          SELECT DISTINCT b.student_id
          FROM bookings b
          WHERE b.reader_id = $1
        ),
        this_week AS (
          SELECT
            ml.student_id,
            COALESCE(SUM(ml.new_verses), 0)::int AS week_new_verses,
            COALESCE(SUM(ml.revised_verses), 0)::int AS week_revised_verses,
            MAX(ml.created_at)::text AS last_activity_at
          FROM memorization_log ml
          WHERE ml.log_date >= date_trunc('week', CURRENT_DATE)::date
          GROUP BY ml.student_id
        ),
        consistency AS (
          SELECT
            ml.student_id,
            COUNT(DISTINCT ml.log_date)::int AS active_days_30
          FROM memorization_log ml
          WHERE ml.log_date >= CURRENT_DATE - 30
          GROUP BY ml.student_id
        ),
        current_goals AS (
          SELECT DISTINCT ON (mg.student_id)
            mg.student_id,
            mg.target_verses,
            mg.status AS goal_status,
            mg.week_start::text AS week_start
          FROM memorization_goals mg
          WHERE mg.week_start >= date_trunc('week', CURRENT_DATE)::date - 2
          ORDER BY mg.student_id, mg.week_start DESC
        )
        SELECT
          u.id AS student_id,
          u.name AS student_name,
          u.email AS student_email,
          COALESCE(c.active_days_30, 0)::int AS active_days_30,
          COALESCE(tw.week_new_verses, 0)::int AS week_new_verses,
          COALESCE(tw.week_revised_verses, 0)::int AS week_revised_verses,
          COALESCE(cg.target_verses, 0)::int AS target_verses,
          cg.goal_status,
          cg.week_start,
          tw.last_activity_at
        FROM reader_students rs
        JOIN users u ON u.id = rs.student_id
        LEFT JOIN this_week tw ON tw.student_id = rs.student_id
        LEFT JOIN consistency c ON c.student_id = rs.student_id
        LEFT JOIN current_goals cg ON cg.student_id = rs.student_id
        ORDER BY COALESCE(tw.week_new_verses, 0) DESC, u.name ASC
        LIMIT 20
      `,
      [session.sub],
    )

    return NextResponse.json({ students: rows })
  } catch (error) {
    console.error("Reader student progress error:", error)
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
  }
}
