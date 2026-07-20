import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { sendEmail } from "@/lib/email"

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: "البريد الإلكتروني مطلوب" }, { status: 400 })
    }

    const users = await query<{ id: string; name: string }>(
      "SELECT id, name FROM users WHERE email = $1 LIMIT 1",
      [email.toLowerCase()]
    )

    if (users.length === 0) {
      return NextResponse.json({
        error: "not_found",
        message: "هذا البريد الإلكتروني غير مسجل لدينا."
      }, { status: 404 })
    }

    const user = users[0]

    // Generate 6-digit verification code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await query(
      "UPDATE users SET reset_code = $1, reset_expires_at = $2 WHERE id = $3",
      [resetCode, expiresAt.toISOString(), user.id]
    )

    // Send the email
    await sendEmail({
      to: email,
      subject: "استعادة كلمة المرور - متقن الفاتحة",
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
          <h2 style="color: #1B5E3B;">أهلاً بك يا ${user.name}</h2>
          <p style="font-size: 16px; color: #475569;">لقد تلقينا طلباً لاستعادة كلمة المرور الخاصة بحسابك في منصة متقن الفاتحة. يرجى استخدام الكود التالي:</p>
          
          <div style="background-color: #f8fafc; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #C9A227;">${resetCode}</span>
          </div>
          
          <p style="font-size: 14px; color: #64748b;">هذا الكود صالح لمدة ساعة واحدة فقط.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #94a3b8; text-align: center;">إذا لم تقم بطلب استعادة كلمة المرور، يرجى إعادة تعيين كلمة مرورك فوراً أو تجاهل هذه الرسالة.</p>
        </div>
      `,
      body: `كود استعادة كلمة المرور الخاص بك هو: ${resetCode}`,
    })

    return NextResponse.json(
      { message: "إذا كان البريد مسجلاً، فسيتم إرسال كود الاستعادة" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
  }
}
