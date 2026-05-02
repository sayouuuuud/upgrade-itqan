import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { signToken } from "@/lib/auth"
import { sendWelcomeEmail } from "@/lib/email"

export async function POST(req: NextRequest) {
    try {
        const { email, code } = await req.json()

        if (!email || !code) {
            return NextResponse.json({ error: "البريد الإلكتروني وكود التحقق مطلوبان" }, { status: 400 })
        }

        const users = await query<{
            id: string
            name: string
            email: string
            role: string
            verification_code: string
            verification_expires_at: string
            email_verified: boolean
        }>(
            `SELECT * FROM users WHERE email = $1 LIMIT 1`,
            [email.toLowerCase()]
        )

        if (users.length === 0) {
            return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 })
        }

        const user = users[0]

        if (user.email_verified) {
            return NextResponse.json({ error: "الحساب مفعل بالفعل" }, { status: 400 })
        }

        if (user.verification_code !== code) {
            return NextResponse.json({ error: "كود التحقق غير صحيح" }, { status: 400 })
        }

        if (new Date(user.verification_expires_at) < new Date()) {
            return NextResponse.json({ error: "كود التحقق منتهي الصلاحية، يرجى طلب كود جديد" }, { status: 400 })
        }

        // Mark as verified and clear code
        await query(
            `UPDATE users SET email_verified = true, verification_code = NULL, verification_expires_at = NULL WHERE id = $1`,
            [user.id]
        )

        // Send welcome email
        sendWelcomeEmail(user.email, user.name)

        // Log the user in
        const token = await signToken({
            sub: user.id,
            email: user.email,
            role: user.role as any,
            name: user.name,
            has_academy_access: (user as any).has_academy_access,
            has_quran_access: (user as any).has_quran_access,
        })

        const response = NextResponse.json(
            { 
                message: "تم تفعيل الحساب بنجاح", 
                user: { 
                    id: user.id, 
                    name: user.name, 
                    email: user.email, 
                    role: user.role,
                    has_academy_access: (user as any).has_academy_access,
                    has_quran_access: (user as any).has_quran_access
                } 
            },
            { status: 200 }
        )

        response.cookies.set({
            name: "auth-token",
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 30, // 30 days
            path: "/",
        })

        return response
    } catch (error) {
        console.error("Verification error:", error)
        return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
    }
}
