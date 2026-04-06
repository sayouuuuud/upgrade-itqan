import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { query } from "@/lib/db"
import { createNotificationForAdmins } from "@/lib/notifications"

export async function POST(req: NextRequest) {
  try {
    const {
      full_name_triple,
      email,
      password,
      phone,
      city,
      gender,
      nationality,
      qualification,
      memorized_parts,
      years_of_experience,
      // New required field for vetting
      audio_url,
    } = await req.json()

    // Validate required fields (including audio_url for vetting)
    if (!full_name_triple || !email || !password || !phone || !gender) {
      return NextResponse.json(
        { error: "جميع الحقول الإلزامية مطلوبة" },
        { status: 400 }
      )
    }

    // Audio URL is required for reader vetting
    if (!audio_url) {
      return NextResponse.json(
        { error: "يجب إرفاق تسجيل صوتي للتقييم (تلاوة قصيرة)" },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" },
        { status: 400 }
      )
    }

    if (!['male', 'female'].includes(gender)) {
      return NextResponse.json({ error: "الجنس غير صحيح" }, { status: 400 })
    }

    // Check existing email
    const existing = await query("SELECT id FROM users WHERE email = $1", [
      email.toLowerCase(),
    ])
    if (existing.length > 0) {
      return NextResponse.json(
        { error: "البريد الإلكتروني مسجل مسبقاً" },
        { status: 409 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 10)

    // Create user with pending_approval status
    const users = await query<{ id: string }>(
      `INSERT INTO users (name, email, password_hash, role, gender, approval_status)
       VALUES ($1, $2, $3, 'reader', $4, 'pending_approval')
       RETURNING id`,
      [full_name_triple, email.toLowerCase(), passwordHash, gender]
    )

    const user = users[0]

    if (!user) {
      return NextResponse.json(
        { error: "حدث خطأ أثناء إنشاء الحساب" },
        { status: 500 }
      )
    }

    // Create reader profile with professional details
    await query(
      `INSERT INTO reader_profiles (user_id, full_name_triple, phone, city, nationality, qualification, memorized_parts, years_of_experience)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        user.id,
        full_name_triple,
        phone,
        city || null,
        nationality,
        qualification || null,
        memorized_parts || 0,
        years_of_experience || null,
      ]
    )

    // Save the trial audio in reader_applications table for vetting
    await query(
      `INSERT INTO reader_applications (user_id, audio_url, status, submitted_at)
       VALUES ($1, $2, 'pending', NOW())
       ON CONFLICT (user_id) DO UPDATE SET audio_url = $2, status = 'pending', submitted_at = NOW()`,
      [user.id, audio_url]
    )

    // Notify admins about the new reader application
    try {
      await createNotificationForAdmins({
        type: 'new_reader_application',
        title: 'طلب انضمام مقرئ جديد',
        message: `قدم المقرئ ${full_name_triple} طلباً للانضمام إلى المنصة. يرجى مراجعة بياناته.`,
        category: 'account',
        link: '/admin/reader-applications'
      })
    } catch (notifError) {
      console.error("Failed to notify admins about new reader:", notifError)
    }

    // Do NOT create JWT or log in automatically
    return NextResponse.json(
      {
        message: "تم استلام طلبك، وسيتم مراجعته من قبل الإدارة. سيتم إشعارك عند اعتماد الحساب.",
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Reader register error:", error)
    return NextResponse.json(
      { error: "حدث خطأ في الخادم" },
      { status: 500 }
    )
  }
}
