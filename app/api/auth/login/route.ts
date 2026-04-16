import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { query } from "@/lib/db"
import { signToken } from "@/lib/auth"

const MAX_FAILED_ATTEMPTS = 5

export async function POST(req: NextRequest) {
  try {
    const { email, password, loginType } = await req.json()
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || null

    if (!email || !password) {
      return NextResponse.json(
        { error: "البريد الإلكتروني وكلمة المرور مطلوبان" },
        { status: 400 }
      )
    }

    const users = await query<{
      id: string
      name: string
      email: string
      password_hash: string
      role: "student" | "reader" | "admin" | "student_supervisor" | "reciter_supervisor" | "parent" | "teacher" | "academy_admin"
      is_active: boolean
      is_locked: boolean
      failed_login_count: number
      approval_status: string
      has_academy_access: boolean
      has_quran_access: boolean
    }>(
      `SELECT id, name, email, password_hash, role, is_active, is_locked,
              COALESCE(failed_login_count, 0) AS failed_login_count, approval_status,
              has_academy_access, has_quran_access
       FROM users WHERE email = $1`,
      [email.toLowerCase()]
    )

    const user = users[0]

    // Log failed attempt helper
    const logFailed = async (userId?: string) => {
      try {
        await query(
          `INSERT INTO activity_logs (user_id, action, description, ip_address)
           VALUES ($1, 'login_failed', $2, $3)`,
          [userId || null, `Failed login for ${email}`, ip]
        )
      } catch { }
    }

    if (!user) {
      await logFailed()
      return NextResponse.json(
        { error: "بيانات الدخول غير صحيحة" },
        { status: 401 }
      )
    }

    // Check if account is locked
    if (user.is_locked) {
      await logFailed(user.id)
      return NextResponse.json(
        { error: "الحساب مقفل بسبب محاولات دخول متعددة فاشلة. تواصل مع الإدارة." },
        { status: 403 }
      )
    }

    if (!user.is_active) {
      return NextResponse.json(
        { error: "الحساب معطل. تواصل مع الدعم." },
        { status: 403 }
      )
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash)
    if (!validPassword) {
      // Increment failed count
      const newCount = (user.failed_login_count || 0) + 1
      const shouldLock = newCount >= MAX_FAILED_ATTEMPTS

      await query(
        `UPDATE users
         SET failed_login_count = $1,
             last_failed_login_at = NOW(),
             is_locked = $2,
             locked_at = CASE WHEN $2 THEN NOW() ELSE NULL END
         WHERE id = $3`,
        [newCount, shouldLock, user.id]
      )

      await logFailed(user.id)

      if (shouldLock) {
        return NextResponse.json(
          { error: `تم قفل الحساب بعد ${MAX_FAILED_ATTEMPTS} محاولات فاشلة. تواصل مع الإدارة.` },
          { status: 403 }
        )
      }

      const remaining = MAX_FAILED_ATTEMPTS - newCount
      return NextResponse.json(
        { error: `بيانات الدخول غير صحيحة. تبقى ${remaining} محاولة قبل قفل الحساب.` },
        { status: 401 }
      )
    }

    // Check reader approval
    if (user.role === "reader" && user.approval_status === "pending_approval") {
      return NextResponse.json(
        { error: "تم استلام طلبك، وبانتظار اعتماد الإدارة." },
        { status: 403 }
      )
    }
    if (user.role === "reader" && user.approval_status === "rejected") {
      return NextResponse.json(
        { error: "تم رفض طلب التسجيل. تواصل مع الإدارة لمزيد من المعلومات." },
        { status: 403 }
      )
    }

    // Role assignment based on login context
    let activeRole = user.role;

    if (loginType === "admin") {
      // Admin login page check
      const allowedAdminRoles = ["admin", "student_supervisor", "reciter_supervisor"];
      if (!allowedAdminRoles.includes(user.role)) {
        return NextResponse.json(
          { error: "غير مصرح لك بالدخول كمدير" },
          { status: 403 }
        );
      }
      activeRole = user.role;
    } else {
      // Normal login page check: Force admin to student
      if (user.role === "admin") {
        activeRole = "student";
      }
    }

    // Successful login — reset failed count
    await query(
      `UPDATE users SET failed_login_count = 0, last_login_at = NOW() WHERE id = $1`,
      [user.id]
    )

    const userAgent = req.headers.get("user-agent") || "Unknown"
    const { getDetailedDeviceType, getCountryFromIp } = await import('@/lib/geo')
    const deviceDetail = getDetailedDeviceType(userAgent)

    // Geolocation from IP
    let country = req.headers.get('x-vercel-ip-country') || req.headers.get('cf-ipcountry') || null
    if ((!country || country === 'N/A') && ip) {
      country = await getCountryFromIp(ip)
    }

    // Log successful login with tech details
    await query(
      `INSERT INTO activity_logs (user_id, action, description, ip_address, user_agent)
       VALUES ($1, 'login_success', $2, $3, $4)`,
      [user.id, `Successful login from ${deviceDetail}${country ? ` (${country})` : ''}`, ip, userAgent]
    ).catch(() => { })

    if (activeRole === 'admin' || activeRole === 'student_supervisor' || activeRole === 'reciter_supervisor') {
      const { createNotificationForAdmins } = await import('@/lib/notifications')
      await createNotificationForAdmins({
        type: 'general',
        title: 'تسجيل دخول إداري 🔐',
        message: `قام ${user.name} بتسجيل الدخول إلى لوحة التحكم (${activeRole}) من ${deviceDetail}`,
        category: 'account'
      })
    }

    const token = await signToken({
      sub: user.id,
      email: user.email,
      role: activeRole,
      name: user.name,
      has_academy_access: user.has_academy_access,
      has_quran_access: user.has_quran_access,
    })

    // insert a new session for the active active token
    await query(
      `INSERT INTO user_sessions (user_id, token, ip_address, user_agent, expires_at)
       VALUES ($1, $2, $3, $4, NOW() + INTERVAL '30 days')`,
      [user.id, token, ip, deviceDetail]
    ).catch((err) => {
      console.error("Failed to insert user session:", err)
    })

    const response = NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: activeRole },
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
    console.error("Login error:", error)
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
  }
}
