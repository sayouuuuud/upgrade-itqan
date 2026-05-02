import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import { sendStudentCreatedByTeacherEmail } from "@/lib/email"

function generateTemporaryPassword(): string {
    return crypto.randomBytes(8).toString('base64url')
}

export async function POST(req: NextRequest) {
    try {
        const session = await getSession()
        if (!session || !['teacher', 'academy_admin', 'admin'].includes(session.role)) {
            return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
        }

        const { name, email, gender } = await req.json()

        if (!name || !email) {
            return NextResponse.json({ error: "الاسم والبريد الإلكتروني مطلوبان" }, { status: 400 })
        }

        const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || null

        const temporaryPassword = generateTemporaryPassword()
        const passwordHash = await bcrypt.hash(temporaryPassword, 10)

        let user;
        try {
            const newUsers = await query<{ id: string; name: string; email: string }>(
                `INSERT INTO users (name, email, password_hash, role, gender, has_academy_access, has_quran_access, platform_choice, platform_preference, email_verified, must_change_password, created_by)
         VALUES ($1, $2, $3, 'student', $4, true, true, 'both', 'academy', true, true, $5)
         RETURNING id, name, email`,
                [name, email.toLowerCase(), passwordHash, gender || null, session.sub]
            )
            user = newUsers[0]

            if (!user) {
                throw new Error("Failed to create user")
            }
        } catch (insertError: any) {
            if (insertError.code === '23505') {
                return NextResponse.json({ error: "البريد الإلكتروني مستخدم بالفعل." }, { status: 409 })
            }
            throw insertError
        }

        // Log this action
        await query(
            `INSERT INTO activity_logs (user_id, action, description, ip_address)
       VALUES ($1, 'student_created_by_teacher', $2, $3)`,
            [session.sub, `أنشأ حساب الطالب الجديد ${user.name} (${user.email})`, ip]
        ).catch(() => { })

        try {
            const teacherName = session.name || "معلمك";
            await sendStudentCreatedByTeacherEmail(email.toLowerCase(), name, teacherName, temporaryPassword);
        } catch (emailErr) {
            console.error("Failed to send student creation email:", emailErr);
        }

        return NextResponse.json({ user })
    } catch (error: any) {
        console.error("Create student error:", error)
        return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
    }
}
