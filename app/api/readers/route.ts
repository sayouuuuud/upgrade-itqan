import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query, queryOne } from "@/lib/db"

// Roles that bypass gender segregation
const BYPASS_GENDER_ROLES = ['admin', 'reciter_supervisor', 'student_supervisor']

// GET /api/readers - list available readers (with gender segregation)
export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 })

    // Check if user role bypasses gender filter
    const bypassGenderFilter = BYPASS_GENDER_ROLES.includes(session.role)

    let genderFilter = ""
    const queryParams: unknown[] = []

    if (!bypassGenderFilter) {
      // Get the logged-in user's gender
      const user = await queryOne<{ gender: string }>(
        `SELECT gender FROM users WHERE id = $1`,
        [session.sub]
      )

      if (user?.gender) {
        genderFilter = `AND u.gender = $1`
        queryParams.push(user.gender)
      }
    }

    const readers = await query(
      `SELECT u.id, u.name, u.avatar_url, u.gender,
              rp.specialization, rp.rating, rp.total_reviews,
              rp.is_accepting_students, rp.years_of_experience
       FROM users u
       JOIN reader_profiles rp ON u.id = rp.user_id
       WHERE u.role = 'reader' 
         AND u.is_active = true
         AND u.approval_status IN ('approved', 'auto_approved')
         ${genderFilter}
       ORDER BY rp.rating DESC`,
      queryParams
    )

    return NextResponse.json({ readers })
  } catch (error) {
    console.error("Get readers error:", error)
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
  }
}
