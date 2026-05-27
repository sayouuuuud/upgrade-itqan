import { NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { createTransport } from "nodemailer"

// POST /api/academy/admin/settings/test-email
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || !requireRole(session, ["admin", "academy_admin"])) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
  }

  try {
    const { smtp } = await req.json()

    if (!smtp?.host || !smtp?.port || !smtp?.user || !smtp?.password) {
      return NextResponse.json({ error: "بيانات SMTP غير مكتملة" }, { status: 400 })
    }

    const transporter = createTransport({
      host: smtp.host,
      port: parseInt(smtp.port),
      secure: smtp.port === "465",
      auth: {
        user: smtp.user,
        pass: smtp.password,
      },
    })

    // Verify connection
    await transporter.verify()

    // Send test email
    await transporter.sendMail({
      from: smtp.fromEmail ? `"${smtp.fromName || 'إتقان'}" <${smtp.fromEmail}>` : smtp.user,
      to: session.email,
      subject: "اختبار اتصال البريد الإلكتروني - منصة إتقان",
      html: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1E3A5F; text-align: center;">اختبار اتصال SMTP</h2>
          <p style="color: #333; font-size: 16px; line-height: 1.8;">
            مرحباً ${session.name}،
          </p>
          <p style="color: #333; font-size: 16px; line-height: 1.8;">
            تم إرسال هذه الرسالة بنجاح من إعدادات منصة إتقان الأكاديمية.
          </p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #666; font-size: 14px;">
              <strong>الخادم:</strong> ${smtp.host}<br/>
              <strong>المنفذ:</strong> ${smtp.port}<br/>
              <strong>التاريخ:</strong> ${new Date().toLocaleString('ar-EG')}
            </p>
          </div>
          <p style="color: #666; font-size: 14px; text-align: center;">
            منصة إتقان التعليمية
          </p>
        </div>
      `,
    })

    return NextResponse.json({ success: true, message: "تم إرسال البريد التجريبي بنجاح" })
  } catch (error: any) {
    console.error("[Test Email] Error:", error)
    return NextResponse.json({ 
      error: "فشل في إرسال البريد", 
      details: error.message 
    }, { status: 500 })
  }
}
