import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query, queryOne } from "@/lib/db"

/**
 * GET /api/reader/dashboard-summary
 *
 * Aggregates the actionable pieces the reader dashboard needs in a single
 * round-trip: upcoming sessions (with join links), unread messages /
 * notifications, and competition entries waiting on the reader's evaluation.
 */
export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== "reader") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
    }
    const me = session.sub

    // Upcoming/today sessions (next 7 days) with the student name + join link.
    const upcomingSessions = await query<{
      id: string
      student_name: string | null
      slot_start: string
      slot_end: string | null
      status: string
      meeting_link: string | null
      is_today: boolean
    }>(
      `SELECT b.id,
              s.name AS student_name,
              b.slot_start,
              b.slot_end,
              b.status,
              b.meeting_link,
              (b.slot_start::date = (NOW() AT TIME ZONE 'UTC')::date) AS is_today
       FROM bookings b
       JOIN users s ON s.id = b.student_id
       WHERE b.reader_id = $1
         AND b.status IN ('pending', 'confirmed')
         AND b.slot_start >= NOW() - INTERVAL '30 minutes'
         AND b.slot_start <= NOW() + INTERVAL '7 days'
       ORDER BY b.slot_start ASC
       LIMIT 6`,
      [me]
    )

    // Unread notifications + messages (mirrors /api/unread-counts for readers).
    const notifRow = await queryOne<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM notifications WHERE user_id = $1 AND is_read = false`,
      [me]
    )
    const msgRow = await queryOne<{ sum: string | null }>(
      `SELECT COALESCE(SUM(unread_count_reader), 0)::text AS sum FROM conversations WHERE reader_id = $1`,
      [me]
    )
    const parentMsgRow = await queryOne<{ sum: string | null }>(
      `SELECT COALESCE(SUM(unread_count_reader), 0)::text AS sum FROM parent_reader_conversations WHERE reader_id = $1`,
      [me]
    )

    // Competition entries awaiting this reader's evaluation. Mirrors the
    // surfacing logic in /api/reader/competitions: if the reader is assigned as
    // a judge, only those competitions count; otherwise all active library
    // competitions are fair game.
    const assignedCount = await queryOne<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM competition_judges WHERE judge_id = $1`,
      [me]
    )
    const isAssignedJudge = parseInt(assignedCount?.count || "0", 10) > 0

    const pendingEvalRow = await queryOne<{ count: string }>(
      isAssignedJudge
        ? `SELECT COUNT(*)::text AS count
             FROM competition_entries e
             JOIN competitions c ON c.id = e.competition_id
             JOIN competition_judges j ON j.competition_id = c.id AND j.judge_id = $1
            WHERE e.status = 'pending'
              AND e.submission_url IS NOT NULL
              AND c.status = 'active'`
        : `SELECT COUNT(*)::text AS count
             FROM competition_entries e
             JOIN competitions c ON c.id = e.competition_id
            WHERE e.status = 'pending'
              AND e.submission_url IS NOT NULL
              AND c.status = 'active'
              AND c.scope = 'library'
              AND NOT EXISTS (SELECT 1 FROM competition_judges j2 WHERE j2.competition_id = c.id)`,
      [me]
    )

    return NextResponse.json({
      upcomingSessions,
      unreadMessages:
        parseInt(msgRow?.sum || "0", 10) + parseInt(parentMsgRow?.sum || "0", 10),
      unreadNotifications: parseInt(notifRow?.count || "0", 10),
      pendingCompetitionEvals: parseInt(pendingEvalRow?.count || "0", 10),
    })
  } catch (error) {
    console.error("Reader dashboard summary error:", error)
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
  }
}
