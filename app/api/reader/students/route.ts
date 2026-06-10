import { NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query } from "@/lib/db"

export async function GET() {
  try {
    const session = await getSession()
    if (!session || !requireRole(session, ["reader", "admin"])) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }

    const rows = await query<{
      student_id: string
      student_name: string
      student_email: string | null
      avatar_url: string | null
      gender: string | null
      last_login_at: string | null
      // recitation stats
      total_recitations: number
      pending_recitations: number
      // booking stats
      total_sessions: number
      completed_sessions: number
      // memorization this week
      week_new_verses: number
      week_revised_verses: number
      active_days_30: number
      // path enrollments
      tajweed_paths: number
      memorization_paths: number
    }>(
      `
      WITH reader_students AS (
        SELECT DISTINCT r.student_id
        FROM recitations r
        WHERE r.assigned_reader_id = $1

        UNION

        SELECT DISTINCT b.student_id
        FROM bookings b
        WHERE b.reader_id = $1

        UNION

        SELECT DISTINCT tpe.student_id
        FROM tajweed_path_enrollments tpe
        JOIN tajweed_paths tp ON tp.id = tpe.path_id
        WHERE tp.created_by = $1

        UNION

        SELECT DISTINCT mpe.student_id
        FROM memorization_path_enrollments mpe
        JOIN memorization_paths mp ON mp.id = mpe.path_id
        WHERE mp.created_by = $1
      ),
      recit_stats AS (
        SELECT
          r.student_id,
          COUNT(*)::int                                                   AS total_recitations,
          COUNT(*) FILTER (WHERE r.status = 'pending')::int              AS pending_recitations
        FROM recitations r
        WHERE r.assigned_reader_id = $1
        GROUP BY r.student_id
      ),
      booking_stats AS (
        SELECT
          b.student_id,
          COUNT(*)::int                                                    AS total_sessions,
          COUNT(*) FILTER (WHERE b.status = 'completed')::int             AS completed_sessions
        FROM bookings b
        WHERE b.reader_id = $1
        GROUP BY b.student_id
      ),
      mem_week AS (
        SELECT
          ml.student_id,
          COALESCE(SUM(ml.new_verses), 0)::int     AS week_new_verses,
          COALESCE(SUM(ml.revised_verses), 0)::int AS week_revised_verses
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
      path_counts AS (
        SELECT
          rs.student_id,
          COUNT(DISTINCT tpe.id)::int AS tajweed_paths,
          COUNT(DISTINCT mpe.id)::int AS memorization_paths
        FROM reader_students rs
        LEFT JOIN tajweed_path_enrollments tpe ON tpe.student_id = rs.student_id
        LEFT JOIN memorization_path_enrollments mpe ON mpe.student_id = rs.student_id
        GROUP BY rs.student_id
      )
      SELECT
        u.id                                              AS student_id,
        u.name                                            AS student_name,
        u.email                                           AS student_email,
        u.avatar_url,
        u.gender,
        u.last_login_at::text,
        COALESCE(rs2.total_recitations,  0)              AS total_recitations,
        COALESCE(rs2.pending_recitations, 0)             AS pending_recitations,
        COALESCE(bs.total_sessions,       0)             AS total_sessions,
        COALESCE(bs.completed_sessions,   0)             AS completed_sessions,
        COALESCE(mw.week_new_verses,      0)             AS week_new_verses,
        COALESCE(mw.week_revised_verses,  0)             AS week_revised_verses,
        COALESCE(c.active_days_30,        0)             AS active_days_30,
        COALESCE(pc.tajweed_paths,        0)             AS tajweed_paths,
        COALESCE(pc.memorization_paths,   0)             AS memorization_paths
      FROM reader_students rs
      JOIN users u ON u.id = rs.student_id
      LEFT JOIN recit_stats  rs2 ON rs2.student_id  = rs.student_id
      LEFT JOIN booking_stats bs  ON bs.student_id   = rs.student_id
      LEFT JOIN mem_week      mw  ON mw.student_id   = rs.student_id
      LEFT JOIN consistency   c   ON c.student_id    = rs.student_id
      LEFT JOIN path_counts   pc  ON pc.student_id   = rs.student_id
      ORDER BY COALESCE(mw.week_new_verses, 0) DESC, u.name ASC
      `,
      [session.sub],
    )

    return NextResponse.json({ students: rows })
  } catch (error) {
    console.error("Reader students error:", error)
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
  }
}
