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
            teaching_subjects,
            years_of_experience,
        } = await req.json()

        // Validate required fields
        if (!full_name_triple || !email || !password || !phone || !gender) {
            return NextResponse.json(
                { error: "جميع الحقول الإلزامية مطلوبة" },
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
       VALUES ($1, $2, $3, 'teacher', $4, 'pending_approval')
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

        // Create teacher application
        await query(
            `INSERT INTO teacher_applications (user_id, qualifications, cv_url, status, created_at)
       VALUES ($1, $2, $3, 'pending', NOW())`,
            [
                user.id,
                JSON.stringify({
                    full_name_triple,
                    phone,
                    city: city || null,
                    nationality: nationality || null,
                    qualification: qualification || null,
                    teaching_subjects: teaching_subjects || null,
                    years_of_experience: years_of_experience || null,
                }),
                null,
            ]
        )

        // Notify admins about the new teacher application
        try {
            await createNotificationForAdmins({
                type: 'new_teacher_application',
                title: 'طلب انضمام مدرس جديد',
                message: `قدّم ${full_name_triple} طلباً للانضمام كمدرس في الأكاديمية. يرجى مراجعة بياناته.`,
                category: 'account',
                link: '/academy/admin/teacher-applications'
            })
        } catch (notifError) {
            console.error("Failed to notify admins about new teacher:", notifError)
        }

        return NextResponse.json(
            {
                message: "تم استلام طلبك، وسيتم مراجعته من قبل إدارة الأكاديمية. سيتم إشعارك عند اعتماد الحساب.",
            },
            { status: 201 }
        )
    } catch (error) {
        console.error("Teacher register error:", error)
        return NextResponse.json(
            { error: "حدث خطأ في الخادم" },
            { status: 500 }
        )
    }
}
