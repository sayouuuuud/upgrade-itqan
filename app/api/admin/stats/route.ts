import { NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { queryOne, query } from "@/lib/db"

export async function GET() {
  try {
    const session = await getSession()
    const allowedRoles: ("admin" | "student_supervisor" | "reciter_supervisor" | "academy_admin")[] = ["admin", "student_supervisor", "reciter_supervisor", "academy_admin"]
    if (!requireRole(session, allowedRoles)) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 })
    }

    // Basic Metrics
    const totalStudentsData = await queryOne<{ count: string }>("SELECT COUNT(*) as count FROM users WHERE role = 'student'")
    const totalReadersData = await queryOne<{ count: string }>("SELECT COUNT(*) as count FROM users WHERE role = 'reader'")
    const todayRecitationsData = await queryOne<{ count: string }>("SELECT COUNT(*) as count FROM recitations WHERE created_at >= CURRENT_DATE")
    const pendingAppsData = await queryOne<{ count: string }>("SELECT COUNT(*) as count FROM users WHERE role = 'reader' AND approval_status = 'pending_approval'")

    // Status Distribution
    const statusQuery = await query<{ status: string; count: string }>(
      "SELECT status, COUNT(*) as count FROM recitations GROUP BY status"
    )
    const statusDistribution = {
      pending: 0,
      in_review: 0,
      mastered: 0,
      needs_session: 0,
      session_booked: 0,
      rejected: 0,
    }
    statusQuery.forEach(row => {
      if (row.status in statusDistribution) {
        statusDistribution[row.status as keyof typeof statusDistribution] = parseInt(row.count)
      }
    })

    // Recitations Over Time (simple 30 days mock or simple query)
    const recitationsOverTimeQuery = await query<{ date: string; count: string }>(
      `SELECT to_char(created_at, 'DD/MM') as date, COUNT(*) as count
       FROM recitations
       WHERE created_at >= NOW() - interval '30 days'
       GROUP BY to_char(created_at, 'DD/MM'), DATE(created_at)
       ORDER BY DATE(created_at) ASC
       LIMIT 7`
    )
    const recitationsOverTime = recitationsOverTimeQuery.length > 0 ? recitationsOverTimeQuery.map(r => ({ date: r.date, count: parseInt(r.count) })) : [
      { date: '1', count: 0 }
    ]

    // Readers Activity (Top Readers by Reviews)
    const readersActivityQuery = await query<{ name: string; reviews: string }>(
      `SELECT u.name, COUNT(r.id) as reviews 
       FROM reviews r 
       JOIN users u ON u.id = r.reader_id 
       GROUP BY u.name 
       ORDER BY reviews DESC 
       LIMIT 5`
    )
    const readersActivity = readersActivityQuery.map(r => ({ name: r.name, reviews: parseInt(r.reviews) }))

    // Latest Recitations
    const latestRecitations = await query<{ id: string, studentName: string, surah: string, assignedReaderName: string | null, status: string, createdAt: string }>(
      `SELECT 
         r.id, 
         r.surah_name as "surah", 
         u.name as "studentName", 
         r.status, 
         r.created_at as "createdAt",
         reader.name as "assignedReaderName",
         r.ayah_from as "fromAyah",
         r.ayah_to as "toAyah"
       FROM recitations r
       JOIN users u ON u.id = r.student_id
       LEFT JOIN users reader ON reader.id = r.assigned_reader_id
       ORDER BY r.created_at DESC
       LIMIT 5`
    )

    return NextResponse.json({
      stats: {
        totalStudents: parseInt(totalStudentsData?.count || "0"),
        totalReaders: parseInt(totalReadersData?.count || "0"),
        recitationsToday: parseInt(todayRecitationsData?.count || "0"),
        avgReviewTime: "24",
        avgReviewTimeUnit: "hour",
        pendingReaderApps: parseInt(pendingAppsData?.count || "0"),
        statusDistribution,
        recitationsOverTime,
        readersActivity
      },
      latestRecitations
    })
  } catch (error) {
    console.error("Admin stats error:", error)
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
  }
}
