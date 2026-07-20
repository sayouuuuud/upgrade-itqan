import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { sendEmail } from "@/lib/email"

// POST /api/admin/integrations/test-email
// يُرسل بريدًا تجريبيًا للمدير العام للتحقق من اتصال SMTP.
export async function POST() {
  const session = await getSession()
  const isSuperAdmin = session?.role === "admin" || (session?.role as string) === "super_admin"
  if (!session || !isSuperAdmin) {
    return NextResponse.json({ error: "مخصص للمدير العام فقط" }, { status: 403 })
  }

  try {
    const sent = await sendEmail({
      to: session.email,
      subject: "اختبار اتصال البريد — منصة إتقان",
      body: `مرحباً ${session.name}، هذه رسالة تجريبية للتأكد من صحة إعدادات البريد.`,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; color: #333;">
          <h2 style="color: #0B3D2E; margin-top: 0;">اختبار اتصال البريد الإلكتروني</h2>
          <p>مرحباً <strong>${session.name}</strong>،</p>
          <p>تم إرسال هذه الرسالة التجريبية بنجاح من لوحة التكاملات.</p>
          <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0; font-size: 13px; color: #64748b;">
              التاريخ: ${new Date().toLocaleString("ar-EG")}<br/>
              المُرسَل إليه: ${session.email}
            </p>
          </div>
          <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 24px;">
            منصة متقن التعليمية
          </p>
        </div>
      `,
    })

    if (!sent) {
      return NextResponse.json(
        { error: "فشل الإرسال — تحقق من إعدادات SMTP في إعدادات النظام" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, sentTo: session.email })
  } catch (error: any) {
    return NextResponse.json({ error: "خطأ في الإرسال", details: error.message }, { status: 500 })
  }
}
