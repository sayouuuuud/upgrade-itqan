import { NextRequest, NextResponse } from "next/server"
import { getSession, requireRole } from "@/lib/auth"
import { query } from "@/lib/db"

// Default templates to seed if none exist
const DEFAULT_TEMPLATES = [
    {
        template_key: "recitation_mastered",
        template_name_ar: "إشعار التلاوة المتقنة",
        template_name_en: "Recitation Mastered Notification",
        subject_ar: "تهانينا! قراءتك متقنة - منصة إتقان",
        subject_en: "Congratulations! Your recitation is mastered",
        body_ar: "السلام عليكم {{studentName}}،\\n\\nتهانينا! تمت مراجعة قراءتك لسورة الفاتحة وهي متقنة ماشاء الله.\\nسيتم إشعارك بموعد الحفل الختامي لاحقاً.\\n\\nبارك الله فيك،\\nفريق إتقان",
        body_en: "Hello {{studentName}},\\n\\nCongratulations! Your recitation of Surah Al-Fatiha is mastered.\\nYou will be notified of the closing ceremony later.\\n\\nBest regards,\\nItqaan Team",
        variables: ["studentName"]
    },
    {
        template_key: "recitation_needs_session",
        template_name_ar: "إشعار احتياج الجلسة",
        template_name_en: "Needs Session Notification",
        subject_ar: "تحتاج إلى جلسة تصحيح - منصة إتقان",
        subject_en: "You need a correction session",
        body_ar: "السلام عليكم {{studentName}}،\\n\\nتمت مراجعة قراءتك لسورة الفاتحة. تحتاج إلى جلسة تصحيح بسيطة.\\nيمكنك حجز الموعد الآن من خلال حسابك.\\n\\nبارك الله فيك،\\nفريق إتقان",
        body_en: "Hello {{studentName}},\\n\\nYour recitation of Surah Al-Fatiha has been reviewed. You need a simple correction session.\\nYou can book your appointment now through your account.\\n\\nBest regards,\\nItqaan Team",
        variables: ["studentName"]
    },
    {
        template_key: "reader_approved",
        template_name_ar: "اعتماد المقرئ",
        template_name_en: "Reader Approved",
        subject_ar: "تم اعتماد حسابك كمقرئ - منصة إتقان",
        subject_en: "Your reader account has been approved",
        body_ar: "السلام عليكم {{readerName}}،\\n\\nتم اعتماد حسابك كمقرئ في منصة إتقان.\\nيمكنك الآن تسجيل الدخول والبدء بمراجعة التسجيلات.\\n\\nبارك الله فيك،\\nفريق إتقان",
        body_en: "Hello {{readerName}},\\n\\nYour reader account on Itqaan has been approved.\\nYou can now log in and start reviewing recitations.\\n\\nBest regards,\\nItqaan Team",
        variables: ["readerName"]
    },
    {
        template_key: "reader_rejected",
        template_name_ar: "رفض المقرئ",
        template_name_en: "Reader Rejected",
        subject_ar: "بخصوص طلب التسجيل - منصة إتقان",
        subject_en: "Regarding your reader application",
        body_ar: "السلام عليكم {{readerName}}،\\n\\nنعتذر، لم يتم اعتماد طلبك حالياً.\\n\\nسبب الرفض:\\n{{rejectionReason}}\\n\\nيمكنك مراجعة السبب والمحاولة مرة أخرى عند استيفاء المطلوب.\\n\\nبارك الله فيك،\\nفريق إتقان",
        body_en: "Hello {{readerName}},\\n\\nWe apologize, your application has not been approved at this time.\\n\\nRejection reason:\\n{{rejectionReason}}\\n\\nYou can review the reason and apply again after meeting the requirements.\\n\\nBest regards,\\nItqaan Team",
        variables: ["readerName", "rejectionReason"]
    },
    {
        template_key: "certificate_issued",
        template_name_ar: "إصدار الشهادة",
        template_name_en: "Certificate Issued",
        subject_ar: "تم إصدار شهادة الإتقان! - منصة إتقان",
        subject_en: "Your Mastery Certificate is Issued!",
        body_ar: "السلام عليكم {{studentName}}،\\n\\nمبارك لك إتقانك سورة الفاتحة! يسرنا إبلاغك بأنه تم إصدار شهادتك الرقمية.\\n\\nيمكنك عرضها وتحميلها للطباعة من خلال الرابط التالي:\\n{{certificateLink}}\\n\\nنسأل الله أن ينفع بك،\\nفريق إتقان",
        body_en: "Hello {{studentName}},\\n\\nCongratulations on mastering Surah Al-Fatiha! We are pleased to inform you that your digital certificate has been issued.\\n\\nYou can view and download it for printing using the following link:\\n{{certificateLink}}\\n\\nBest regards,\\nItqaan Team",
        variables: ["studentName", "certificateLink"]
    },
    {
        template_key: "welcome_email",
        template_name_ar: "رسالة الترحيب",
        template_name_en: "Welcome Email",
        subject_ar: "أهلاً بك في منصة إتقان الفاتحة",
        subject_en: "Welcome to Itqaan Platform",
        body_ar: "مرحباً بك {{userName}} في منصتنا.\\nنسأل الله لك التوفيق في رحلة إتقان سورة الفاتحة.\\n\\nفريق العمل",
        body_en: "Welcome {{userName}} to our platform.\\nWe wish you success in your journey to master Surah Al-Fatiha.\\n\\nTeam",
        variables: ["userName"]
    }
]

export async function GET() {
    try {
        const session = await getSession()
        if (!session || !requireRole(session, ["admin"])) {
            return NextResponse.json({ error: "غير مصرح للمستخدم" }, { status: 401 })
        }

        let templates = await query(`SELECT * FROM email_templates ORDER BY created_at ASC`)

        // Seed if empty
        if (!templates || templates.length === 0) {
            for (const t of DEFAULT_TEMPLATES) {
                await query(
                    `INSERT INTO email_templates 
            (template_key, template_name_ar, template_name_en, subject_ar, subject_en, body_ar, body_en, variables)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (template_key) DO NOTHING`,
                    [t.template_key, t.template_name_ar, t.template_name_en, t.subject_ar, t.subject_en, t.body_ar, t.body_en, JSON.stringify(t.variables)]
                )
            }
            templates = await query(`SELECT * FROM email_templates ORDER BY created_at ASC`)
        }

        return NextResponse.json({ templates })
    } catch (error) {
        console.error("Get email templates error:", error)
        return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
    }
}

export async function PUT(req: NextRequest) {
    try {
        const session = await getSession()
        if (!session || !requireRole(session, ["admin"])) {
            return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
        }

        const { template_key, subject_ar, subject_en, body_ar, body_en, is_active } = await req.json()

        if (!template_key || !subject_ar || !body_ar) {
            return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 })
        }

        const result = await query(
            `UPDATE email_templates SET
         subject_ar = $1,
         subject_en = $2,
         body_ar = $3,
         body_en = $4,
         is_active = $5,
         updated_at = NOW()
       WHERE template_key = $6
       RETURNING *`,
            [subject_ar, subject_en || subject_ar, body_ar, body_en || body_ar, is_active !== false, template_key]
        )

        if (result.length === 0) {
            return NextResponse.json({ error: "القالب غير موجود" }, { status: 404 })
        }

        return NextResponse.json({ success: true, template: result[0] })
    } catch (error) {
        console.error("Update email template error:", error)
        return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
    }
}
export async function POST(req: NextRequest) {
    try {
        const session = await getSession()
        if (!session || !requireRole(session, ["admin"])) {
            return NextResponse.json({ error: "غير مصرح" }, { status: 401 })
        }

        const { to, subject, body, variables } = await req.json()

        if (!to || !subject || !body) {
            return NextResponse.json({ error: "بيانات الإرسال ناقصة" }, { status: 400 })
        }

        // Simple variable replacement for test
        let finalSubject = subject
        let finalBody = body
        if (variables) {
            for (const [k, v] of Object.entries(variables)) {
                const regex = new RegExp(`{{${k}}}`, 'g')
                finalSubject = finalSubject.replace(regex, v)
                finalBody = finalBody.replace(regex, v)
            }
        }

        const { getLastEmailError, sendEmail } = await import("@/lib/email")
        const success = await sendEmail({
            to,
            subject: `[تجربة] ${finalSubject}`,
            body: finalBody,
            html: `<div dir="rtl" style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <p style="color: #666; font-size: 12px; margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px;">هذه رسالة تجريبية من لوحة تحكم إتقان</p>
                    ${finalBody.split('\\n').map((l: string) => `<p>${l}</p>`).join('')}
                   </div>`
        })

        return NextResponse.json({ success, error: success ? null : getLastEmailError() })
    } catch (error) {
        console.error("Send test email error:", error)
        return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 })
    }
}
