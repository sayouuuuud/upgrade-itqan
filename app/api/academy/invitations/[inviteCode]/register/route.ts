import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { query, queryOne } from "@/lib/db"
import { signToken } from "@/lib/auth"
import { sendWelcomeEmail } from "@/lib/email"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ inviteCode: string }> }
) {
  try {
    const { inviteCode } = await params
    const { name, password, gender } = await req.json()

    if (!name || !password) {
      return NextResponse.json({ error: "الاسم وكلمة المرور مطلوبان" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" }, { status: 400 })
    }

    // Find the invitation
    const invitations = await query<any>(
      `SELECT i.*, c.title AS plan_title
       FROM invitations i
       LEFT JOIN courses c ON c.id = i.plan_id
       WHERE i.token = $1`,
      [inviteCode]
    )

    if (!invitations.length) {
      return NextResponse.json({ error: "رابط الدعوة غير صالح" }, { status: 404 })
    }

    const inv = invitations[0]

    if (inv.status === 'ACCEPTED') {
      return NextResponse.json({ error: "تم قبول هذه الدعوة مسبقاً" }, { status: 400 })
    }
    if (inv.status === 'CANCELLED') {
      return NextResponse.json({ error: "تم إلغاء هذه الدعوة" }, { status: 400 })
    }
    if (inv.status === 'EXPIRED' || (inv.expires_at && new Date(inv.expires_at) < new Date())) {
      await query(`UPDATE invitations SET status = 'EXPIRED' WHERE id = $1`, [inv.id])
      return NextResponse.json({ error: "انتهت صلاحية هذه الدعوة" }, { status: 410 })
    }

    // Check if user with this email already exists
    const existing = await queryOne<{ id: string }>(
      "SELECT id FROM users WHERE email = $1 LIMIT 1",
      [inv.email.toLowerCase()]
    )

    let userId: string
    let finalRole = inv.role_to_assign

    if (existing) {
      // User exists, just update role if needed
      userId = existing.id
      if (finalRole) {
        await query(`UPDATE users SET role = $1 WHERE id = $2`, [finalRole, userId])
      }
    } else {
      // Create user
      const passwordHash = await bcrypt.hash(password, 10)
      
      // Determine access flags
      const isParent = finalRole === 'parent'
      const hasQuranAccess = !isParent
      const hasAcademyAccess = true // Assumes academy invites give academy access
      
      const newUsers = await query<{ id: string; name: string; email: string; role: string }>(
        `INSERT INTO users (name, email, password_hash, role, gender, has_quran_access, has_academy_access, email_verified)
         VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
         RETURNING id, name, email, role`,
        [name, inv.email.toLowerCase(), passwordHash, finalRole, gender || null, hasQuranAccess, hasAcademyAccess]
      )
      
      const newUser = newUsers[0]
      userId = newUser.id

      // Send welcome email asynchronously
      sendWelcomeEmail(newUser.email, newUser.name).catch(console.error)
    }

    // Enroll in plan (plan_id is a course/plan in the courses table)
    let enrolledPlanId: string | null = null
    if (inv.plan_id) {
      try {
        await query(
          `INSERT INTO enrollments (student_id, course_id, status, enrolled_at)
           VALUES ($1, $2, 'active', NOW())
           ON CONFLICT (student_id, course_id) DO UPDATE SET status = 'active'`,
          [userId, inv.plan_id]
        )
        enrolledPlanId = inv.plan_id
      } catch (e: any) {
        if (e.code !== '23505') throw e
      }
    }

    // Legacy: also enroll in target_course_id if present
    if (inv.target_course_id && inv.target_course_id !== inv.plan_id) {
      try {
        await query(
          `INSERT INTO enrollments (student_id, course_id, status, enrolled_at)
           VALUES ($1, $2, 'active', NOW())
           ON CONFLICT (student_id, course_id) DO UPDATE SET status = 'active'`,
          [userId, inv.target_course_id]
        )
      } catch (e: any) {
        if (e.code !== '23505') throw e
      }
    }

    // Mark accepted
    await query(
      `UPDATE invitations
       SET status = 'ACCEPTED', accepted_at = NOW(), accepted_by_user_id = $1
       WHERE id = $2`,
      [userId, inv.id]
    )

    // Audit history — best effort
    await query(
      `INSERT INTO invitation_history (invitation_id, previous_status, new_status, changed_by)
       VALUES ($1, $2, 'ACCEPTED', $3)`,
      [inv.id, inv.status, userId]
    ).catch(() => {})

    // Create login session
    const token = await signToken({
      sub: userId,
      email: inv.email.toLowerCase(),
      role: finalRole,
      name,
      has_academy_access: true,
      has_quran_access: !isParent,
    })

    const response = NextResponse.json({
      success: true,
      enrolledPlanId,
      planTitle: inv.plan_title || null,
      role: finalRole,
      redirect: enrolledPlanId
        ? `/academy/student/courses/${enrolledPlanId}`
        : '/academy/student',
    })

    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Invitation register error:", error)
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
  }
}
