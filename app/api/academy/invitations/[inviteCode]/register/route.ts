import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { query, queryOne } from '@/lib/db'
import { signToken } from '@/lib/auth'
import { sendInvitationWelcomeEmail } from '@/lib/email'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ inviteCode: string }> }
) {
  try {
    const { inviteCode } = await params
    const { name, password, gender } = await req.json()

    if (!name || !password) {
      return NextResponse.json({ error: 'الاسم وكلمة المرور مطلوبان' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' }, { status: 400 })
    }

    // 1. Fetch invitation
    const invitations = await query<any>(
      `SELECT i.*, 
              COALESCE(c.title, mp.title) AS plan_title,
              CASE WHEN c.id IS NOT NULL THEN 'course'
                   WHEN mp.id IS NOT NULL THEN 'path'
                   ELSE NULL END as plan_type
       FROM invitations i
       LEFT JOIN courses c ON c.id = i.plan_id
       LEFT JOIN memorization_paths mp ON mp.id::text = i.plan_id::text
       WHERE i.token = $1`,
      [inviteCode]
    )

    if (!invitations.length) {
      return NextResponse.json({ error: 'رابط الدعوة غير صالح' }, { status: 404 })
    }

    const inv = invitations[0]

    if (inv.status === 'ACCEPTED') {
      return NextResponse.json({ error: 'تم قبول هذه الدعوة مسبقاً' }, { status: 400 })
    }
    if (inv.status === 'CANCELLED') {
      return NextResponse.json({ error: 'تم إلغاء هذه الدعوة' }, { status: 400 })
    }
    if (inv.status === 'EXPIRED' || (inv.expires_at && new Date(inv.expires_at) < new Date())) {
      await query(`UPDATE invitations SET status = 'EXPIRED' WHERE id = $1`, [inv.id])
      return NextResponse.json({ error: 'انتهت صلاحية هذه الدعوة' }, { status: 410 })
    }

    const email = inv.email.toLowerCase()

    // 2. Check if user already exists
    const existingUser = await queryOne<{ id: string }>(
      'SELECT id FROM users WHERE email = $1 LIMIT 1',
      [email]
    )

    if (existingUser) {
      return NextResponse.json(
        { error: 'يوجد حساب مسجل بهذا البريد الإلكتروني. يرجى تسجيل الدخول وقبول الدعوة من الداخل.' },
        { status: 409 }
      )
    }

    // 3. Create user
    const passwordHash = await bcrypt.hash(password, 10)
    const role = inv.role_to_assign || 'student'

    // Determine platform accesses based on role logic
    let hasAcademyAccess = false
    let hasQuranAccess = false
    let platformPreference = 'both'

    if (role === 'parent' || role === 'teacher' || role === 'academy_student') {
      hasAcademyAccess = true
      platformPreference = 'academy'
    } else if (role === 'student') {
      hasQuranAccess = true
      hasAcademyAccess = true
      platformPreference = 'both'
    } else {
      // Admins or supervisors
      hasAcademyAccess = true
      hasQuranAccess = true
    }

    // Clean up role (e.g. 'academy_student' might just map to 'student' in DB? In DB it's often 'student')
    const dbRole = role === 'academy_student' ? 'student' : role

    let user: any
    try {
      const newUsers = await query<{ id: string; name: string; email: string; role: string }>(
        `INSERT INTO users (name, email, password_hash, role, gender, has_quran_access, has_academy_access, platform_preference, email_verified)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)
         RETURNING id, name, email, role`,
        [name, email, passwordHash, dbRole, gender || null, hasQuranAccess, hasAcademyAccess, platformPreference]
      )
      user = newUsers[0]
      if (!user) throw new Error('فشل إنشاء الحساب')
    } catch (insertError) {
      console.error('Registration via invite error:', insertError)
      return NextResponse.json({ error: 'فشل إنشاء الحساب' }, { status: 500 })
    }

    // 4. Enroll in plan if target exists
    let enrolledPlanId: string | null = null
    const targetCourseId = inv.plan_id || inv.target_course_id
    if (targetCourseId) {
      if (inv.plan_type === 'course') {
        try {
          await query(
            `INSERT INTO enrollments (student_id, course_id, status, enrolled_at)
             VALUES ($1, $2, 'active', NOW())
             ON CONFLICT (student_id, course_id) DO UPDATE SET status = 'active'`,
            [user.id, targetCourseId]
          )
          enrolledPlanId = targetCourseId
        } catch (e: any) {
          if (e.code !== '23505') console.error('Course enrollment error:', e)
        }
      } else if (inv.plan_type === 'path') {
        try {
          await query(
            `INSERT INTO memorization_path_enrollments (student_id, path_id, status, enrolled_at)
             VALUES ($1, $2, 'active', NOW())
             ON CONFLICT (student_id, path_id) DO UPDATE SET status = 'active'`,
            [user.id, targetCourseId]
          )
          enrolledPlanId = targetCourseId
        } catch (e: any) {
          if (e.code !== '23505') console.error('Path enrollment error:', e)
        }
      }
    }

    // 5. Update invitation status
    await query(
      `UPDATE invitations
       SET status = 'ACCEPTED', accepted_at = NOW(), accepted_by_user_id = $1
       WHERE id = $2`,
      [user.id, inv.id]
    )

    // Audit history
    await query(
      `INSERT INTO invitation_history (invitation_id, previous_status, new_status, changed_by)
       VALUES ($1, $2, 'ACCEPTED', $3)`,
      [inv.id, inv.status, user.id]
    ).catch(() => {})

    // 6. Generate Session and Login User
    const rawIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip')
    const ip = rawIp || null
    const userAgent = req.headers.get('user-agent') || 'Unknown'

    const token = await signToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      has_academy_access: hasAcademyAccess,
      has_quran_access: hasQuranAccess,
    })

    await query(
      `INSERT INTO user_sessions (user_id, token, ip_address, user_agent, expires_at)
       VALUES ($1, $2, $3, $4, NOW() + INTERVAL '30 days')`,
      [user.id, token, ip, userAgent]
    ).catch((err) => console.error('Failed to insert user session:', err))

    // 7. Send Welcome Email
    const ROLE_LABELS: Record<string, string> = {
      academy_student: 'طالب في الأكاديمية',
      student: 'طالب',
      teacher: 'معلم',
      parent: 'ولي أمر',
      fiqh_supervisor: 'مشرف أسئلة الفقه',
      content_supervisor: 'مشرف المحتوى',
    }
    const roleLabel = ROLE_LABELS[role] || role
    await sendInvitationWelcomeEmail(email, user.name, roleLabel).catch(e => console.error('Welcome email failed:', e))

    let redirectUrl = '/academy/student'
    if (user.role === 'parent') redirectUrl = '/academy/parent'
    else if (user.role === 'student' || user.role === 'reader') redirectUrl = `/${user.role}`

    if (enrolledPlanId) {
      if (inv.plan_type === 'course') redirectUrl = `/academy/student/courses/${enrolledPlanId}`
      else if (inv.plan_type === 'path' && user.role === 'student') redirectUrl = `/student/memorization-paths`
    }

    const response = NextResponse.json({
      success: true,
      enrolledPlanId,
      planTitle: inv.plan_title || null,
      role: user.role,
      redirect: redirectUrl,
    })

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Invite register error:', error)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
