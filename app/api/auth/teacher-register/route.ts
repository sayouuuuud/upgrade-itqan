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
        const existing = await query("SELECT id, approval_status FROM users WHERE email = $1", [
            email.toLowerCase(),
        ])
        
        let userId;
        const passwordHash = await bcrypt.hash(password, 10)

        if (existing.length > 0) {
            const user = existing[0]
            if (user.approval_status === 'rejected') {
                // المدرس اترفض قبل كده، نخليه يقدم من جديد ونحدث بياناته
                await query(
                    `UPDATE users 
                     SET name = $1, password_hash = $2, gender = $3, approval_status = 'pending_approval' 
                     WHERE id = $4`,
                    [full_name_triple, passwordHash, gender, user.id]
                )
                userId = user.id

                // تحديث الطلب السابق إن وُجد
                const existingApp = await query("SELECT id FROM teacher_applications WHERE user_id = $1", [user.id])
                if (existingApp.length > 0) {
                    await query(
                        `UPDATE teacher_applications 
                         SET qualifications = $1, status = 'pending', created_at = NOW(), rejection_count = COALESCE(rejection_count, 0) + 1 
                         WHERE user_id = $2`,
                        [
                            JSON.stringify({
                                full_name_triple, phone, city: city || null, nationality: nationality || null,
                                qualification: qualification || null, teaching_subjects: teaching_subjects || null,
                                years_of_experience: years_of_experience || null,
                            }),
                            user.id
                        ]
                    )
                } else {
                    await query(
                        `INSERT INTO teacher_applications (user_id, qualifications, cv_url, status, created_at, rejection_count)
                         VALUES ($1, $2, $3, 'pending', NOW(), 1)`,
                        [
                            userId,
                            JSON.stringify({
                                full_name_triple, phone, city: city || null, nationality: nationality || null,
                                qualification: qualification || null, teaching_subjects: teaching_subjects || null,
                                years_of_experience: years_of_experience || null,
                            }),
                            null,
                        ]
                    )
                }
            } else {
                return NextResponse.json(
                    { error: "البريد الإلكتروني مسجل مسبقاً" },
                    { status: 409 }
                )
            }
        } else {
            const users = await query<{ id: string }>(
                `INSERT INTO users (name, email, password_hash, role, gender, approval_status, has_academy_access, has_quran_access, platform_choice, platform_preference)
           VALUES ($1, $2, $3, 'teacher', $4, 'pending_approval', true, false, 'academy', 'academy')
           RETURNING id`,
                [full_name_triple, email.toLowerCase(), passwordHash, gender]
            )

            userId = users[0]?.id

            if (!userId) {
                return NextResponse.json(
                    { error: "حدث خطأ أثناء إنشاء الحساب" },
                    { status: 500 }
                )
            }

            // Create teacher application
            await query(
                `INSERT INTO teacher_applications (user_id, qualifications, cv_url, status, created_at, rejection_count)
           VALUES ($1, $2, $3, 'pending', NOW(), 0)`,
                [
                    userId,
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
        }


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
