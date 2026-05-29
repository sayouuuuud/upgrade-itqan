import { NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { createTransport } from "nodemailer"
import { query } from "@/lib/db"

// POST /api/admin/settings/test-email
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || !requireRole(session, ["admin"])) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  try {
    const { smtp } = await req.json()

    if (!smtp?.host || !smtp?.port || !smtp?.user) {
      return NextResponse.json({ error: "بيانات SMTP غير مكتملة" }, { status: 400 })
    }

    // If the password is masked, fall back to the stored value
    let password = smtp.password
    if (!password || password === "********") {
      const existing = await query<{ setting_value: any }>(
        `SELECT setting_value FROM system_settings WHERE setting_key = 'smtp_config'`
      )
      password = existing?.[0]?.setting_value?.password
    }

    if (!password) {
      return NextResponse.json({ error: "كلمة مرور SMTP غير متوفرة" }, { status: 400 })
    }

    const port = parseInt(String(smtp.port))
    const transporter = createTransport({
      host: smtp.host,
      port,
      secure: typeof smtp.secure === "boolean" ? smtp.secure : port === 465,
      auth: { user: smtp.user, pass: password },
    })

    await transporter.verify()

    await transporter.sendMail({
      from: smtp.fromEmail ? `"${smtp.fromName || "مقرأة إتقان"}" <${smtp.fromEmail}>` : smtp.user,
      to: session.email,
      subject: "اختبار اتصال البريد الإلكتروني - مقرأة إتقان",
      html: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1E3A5F; text-align: center;">اختبار اتصال SMTP</h2>
          <p style="color: #333; font-size: 16px; line-height: 1.8;">مرحباً ${session.name}،</p>
          <p style="color: #333; font-size: 16px; line-height: 1.8;">
            تم إرسال هذه الرسالة بنجاح من إعدادات نظام مقرأة إتقان.
          </p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #666; font-size: 14px;">
              <strong>الخادم:</strong> ${smtp.host}<br/>
              <strong>المنفذ:</strong> ${smtp.port}<br/>
              <strong>التاريخ:</strong> ${new Date().toLocaleString("ar-EG")}
            </p>
          </div>
          <p style="color: #666; font-size: 14px; text-align: center;">منصة إتقان التعليمية</p>
        </div>
      `,
    })

    return NextResponse.json({ success: true, message: "تم إرسال البريد التجريبي بنجاح" })
  } catch (error: any) {
    console.error("[Maqraah Test Email] Error:", error)
    return NextResponse.json({ error: "فشل في إرسال البريد", details: error.message }, { status: 500 })
  }
}
