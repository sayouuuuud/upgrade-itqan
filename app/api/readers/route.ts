import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"

// GET /api/readers - list available readers
export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

    const readers = await query(
      `SELECT u.id, u.name, u.avatar_url, u.gender,
              rp.specialization, rp.rating, rp.total_reviews,
              rp.is_accepting_students, rp.years_of_experience
       FROM users u
       JOIN reader_profiles rp ON u.id = rp.user_id
       WHERE u.role = 'reader' 
         AND u.is_active = true
         AND u.approval_status IN ('approved', 'auto_approved')
       ORDER BY rp.rating DESC`
    )

    return NextResponse.json({ readers })
  } catch (error) {
    console.error("Get readers error:", error)
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
  }
}
