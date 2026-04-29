// Email helper - placeholder ready to be connected to any email service
// Supported services: Resend, Nodemailer, SendGrid
// Set EMAIL_SERVICE and relevant API keys in environment variables

interface Attachment {
  filename: string
  path?: string
  content?: Buffer | string
  contentType?: string
}

interface EmailOptions {
  to: string
  subject: string
  body: string
  html?: string
  attachments?: Attachment[]
}

import nodemailer from 'nodemailer'
import { getSmtpUrl, getSmtpFromEmail } from './settings'

let cachedTransporter: nodemailer.Transporter | null = null
let cachedSmtpUrl: string | undefined = undefined

export async function sendEmail({ to, subject, body, html, attachments }: EmailOptions): Promise<boolean> {
  const smtpUrl = await getSmtpUrl()

  if (!smtpUrl) {
    console.log(`[Email DEV MODE] Sending to: ${to}, Subject: ${subject}`)
    console.log(`[Email] HTML/Body:`, html || body)
    if (attachments?.length) console.log(`[Email] Attachments:`, attachments.map(a => a.filename))
    return true
  }

  try {
    // Cache the transporter to avoid repeated handshake overhead
    if (!cachedTransporter || smtpUrl !== cachedSmtpUrl) {
      if (cachedTransporter) {
        cachedTransporter.close()
      }
      cachedSmtpUrl = smtpUrl
      cachedTransporter = nodemailer.createTransport(smtpUrl)
      console.log("[Email] New transporter created and cached.")
    }

    const fromStr = await getSmtpFromEmail()

    await cachedTransporter.sendMail({
      from: fromStr, // MUST Exactly match the authenticated email when using Gmail to avoid spam filters and delivery failures
      to,
      subject,
      text: body,
      html: html || body,
      attachments: attachments || [],
    })

    return true
  } catch (error) {
    console.error("[Email] Failed to send:", error)
    // Clear cache on error to ensure we try fresh on next attempt
    cachedTransporter = null
    cachedSmtpUrl = undefined
    return false
  }
}

// Basic verification email doesn't need to be in the DB to keep Auth standalone
export function sendVerificationEmail(to: string, userName: string, code: string) {
  return sendEmail({
    to,
    subject: "كود تفعيل حسابك - إتقان التعليمية",
    body: `كود التفعيل الخاص بك هو: ${code}`,
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #0B3D2E;">أهلاً بك يا ${userName} في منصة إتقان التعليمية</h2>
        <p style="font-size: 16px; color: #475569;">شكراً لتسجيلك معنا. لتفعيل حسابك، يرجى استخدام الكود التالي:</p>
        
        <div style="background-color: #f8fafc; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #D4A843;">${code}</span>
        </div>
        
        <p style="font-size: 14px; color: #64748b;">هذا الكود صالح لمدة 24 ساعة فقط.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #94a3b8; text-align: center;">إذا لم تقم بإنشاء هذا الحساب، يرجى تجاهل هذه الرسالة.</p>
      </div>
    `,
  })
}

// Helper to fetch and render dynamic templates
import { queryOne } from '@/lib/db'

async function sendDynamicEmail(templateKey: string, to: string, variables: Record<string, string>, attachments?: Attachment[]) {
  try {
    const template = await queryOne<{ subject_ar: string; body_ar: string; is_active: boolean }>(
      `SELECT subject_ar, body_ar, is_active FROM email_templates WHERE template_key = $1`,
      [templateKey]
    )

    if (!template) {
      console.warn(`[Email] Template ${templateKey} not found in DB.`)
      return false
    }

    if (!template.is_active) {
      console.log(`[Email] Template ${templateKey} is disabled. Skipping.`)
      return true
    }

    let subject = template.subject_ar
    let body = template.body_ar

    // Replace variables (e.g., {{studentName}})
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g')
      subject = subject.replace(regex, value)
      body = body.replace(regex, value)
    }

    // Convert newlines to HTML lines (simple rendering)
    const htmlBody = `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        ${body.split('\\n').map((line: string) => `<p>${line}</p>`).join('')}
      </div>
    `

    return sendEmail({
      to,
      subject,
      body,
      html: htmlBody,
      attachments
    })
  } catch (error) {
    console.error(`[Email] Error sending dynamic template ${templateKey}:`, error)
    return false
  }
}

// Pre-built email templates mapping
export function sendWelcomeEmail(to: string, userName: string) {
  return sendDynamicEmail("welcome_email", to, { userName })
}

export function sendMasteredEmail(to: string, studentName: string) {
  return sendDynamicEmail("recitation_mastered", to, { studentName })
}

export function sendNeedsSessionEmail(to: string, studentName: string) {
  return sendDynamicEmail("recitation_needs_session", to, { studentName })
}

export function sendReaderApprovedEmail(to: string, readerName: string) {
  return sendDynamicEmail("reader_approved", to, { readerName })
}

export function sendReaderRejectedEmail(to: string, readerName: string) {
  return sendDynamicEmail("reader_rejected", to, { readerName })
}

export function sendTeacherApprovedEmail(to: string, teacherName: string) {
  return sendDynamicEmail("teacher_approved", to, { teacherName })
}

export function sendTeacherRejectedEmail(to: string, teacherName: string) {
  return sendDynamicEmail("teacher_rejected", to, { teacherName })
}

export async function sendCertificateIssuedEmail(
  to: string,
  studentName: string,
  certificateLink: string,
  ceremonyDate?: string | null,
  ceremonyMessage?: string,
  certificateImageUrl?: string | null,
  certificateImageBuffer?: Buffer | null
) {
  // Format ceremony info
  let ceremonyHtml = ''
  if (ceremonyDate) {
    const formattedDate = new Date(ceremonyDate).toLocaleDateString('ar-SA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    ceremonyHtml = `
      <div style="background: linear-gradient(135deg, #0B3D2E 0%, #1A6B50 100%); color: white; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
        <p style="font-size: 13px; margin: 0 0 6px; opacity: 0.8;">🎓 حفل الختام والتكريم</p>
        <p style="font-size: 22px; font-weight: bold; margin: 0 0 6px;">${formattedDate}</p>
        ${ceremonyMessage ? `<p style="font-size: 14px; margin: 10px 0 0; opacity: 0.9;">${ceremonyMessage}</p>` : ''}
      </div>
    `
  }

  // Build attachments list if certificate image available
  const attachments: Attachment[] = []
  if (certificateImageBuffer) {
    attachments.push({
      filename: `شهادة-${studentName}.png`,
      content: certificateImageBuffer,
      contentType: 'image/png',
    })
    console.log('Certificate image attached to email, size:', certificateImageBuffer.byteLength)
  } else if (certificateImageUrl) {
    // Fallback if only URL is available
    try {
      console.log('Downloading certificate image for attachment:', certificateImageUrl)
      const imageResponse = await fetch(certificateImageUrl)
      if (imageResponse.ok) {
        const fetchedBuffer = await imageResponse.arrayBuffer()
        attachments.push({
          filename: `شهادة-${studentName}.png`,
          content: Buffer.from(fetchedBuffer),
          contentType: 'image/png',
        })
        console.log('Certificate image downloaded successfully, size:', fetchedBuffer.byteLength)
      } else {
        console.error('Failed to download certificate image:', imageResponse.status)
      }
    } catch (error) {
      console.error('Error downloading certificate image for attachment:', error)
    }
  }

  const html = `
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; border: 1px solid #e2e8f0; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #0B3D2E; font-size: 26px; margin-bottom: 4px;">إتقان التعليمية</h1>
        <p style="color: #64748b; font-size: 14px;">منصة تحسين التلاوة</p>
      </div>

      <h2 style="color: #0B3D2E; font-size: 20px; margin-bottom: 8px;">تهانينا يا ${studentName} 🎉</h2>
      <p style="color: #475569; line-height: 1.7;">
        يسعدنا إخبارك بأن تلاوتك لسورة الفاتحة قد اعتُمدت وصدرت لك شهادة الإتقان الرسمية.
        بارك الله فيك وجعلها في ميزان حسناتك.
      </p>

      ${ceremonyHtml}

      <div style="margin: 24px 0; text-align: center;">
        <a href="${certificateLink}" target="_blank"
           style="display: inline-block; background-color: #0B3D2E; color: white; text-decoration: none;
                  padding: 14px 36px; border-radius: 10px; font-weight: bold; font-size: 16px;">
          🔗 عرض الشهادة الرقمية
        </a>
      </div>

      ${certificateImageUrl ? `<p style="color: #64748b; font-size: 13px; text-align: center;">تجد نسخة من شهادتك مرفقة بهذا البريد.</p>` : ''}

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="font-size: 12px; color: #94a3b8; text-align: center;">
        منصة إتقان التعليمية — جميع الحقوق محفوظة
      </p>
    </div>
  `

  return sendEmail({
    to,
    subject: `🏅 تهانينا يا ${studentName} — صدرت شهادتك في إتقان التعليمية`,
    body: `تهانينا يا ${studentName}! صدرت شهادة إتقانك. رابط الشهادة: ${certificateLink}`,
    html,
    attachments: attachments.length > 0 ? attachments : undefined,
  })
}
export function sendSessionLinkEmail(
  to: string,
  studentName: string,
  readerName: string,
  sessionDate: string,
  sessionTime: string,
  meetingLink: string
) {
  const html = `
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; border: 1px solid #e2e8f0; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #0B3D2E; font-size: 24px; margin-bottom: 4px;">إتقان التعليمية</h1>
        <p style="color: #64748b; font-size: 13px;">تفاصيل جلسة التسميع</p>
      </div>

      <h2 style="color: #0B3D2E; font-size: 18px;">أهلاً ${studentName} 👋</h2>
      <p style="color: #475569; line-height: 1.7;">
        تم تحديد رابط جلسة التسميع الخاصة بك. إليك تفاصيل الجلسة:
      </p>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin: 20px 0;">
        <p style="margin: 8px 0;"><strong>📖 المقرئ:</strong> ${readerName}</p>
        <p style="margin: 8px 0;"><strong>📅 التاريخ:</strong> ${sessionDate}</p>
        <p style="margin: 8px 0;"><strong>🕐 الوقت:</strong> ${sessionTime}</p>
      </div>

      <div style="margin: 24px 0; text-align: center;">
        <a href="${meetingLink}" target="_blank"
           style="display: inline-block; background-color: #0B3D2E; color: white; text-decoration: none;
                  padding: 14px 36px; border-radius: 10px; font-weight: bold; font-size: 16px;">
          🔗 انضم للجلسة
        </a>
      </div>

      <p style="color: #64748b; font-size: 13px; text-align: center;">
        احرص على الانضمام في الموعد المحدد. بالتوفيق! 🌟
      </p>

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="font-size: 12px; color: #94a3b8; text-align: center;">منصة إتقان التعليمية — جميع الحقوق محفوظة</p>
    </div>
  `
  return sendEmail({
    to,
    subject: `🔗 تم تحديد رابط جلستك مع ${readerName} — إتقان التعليمية`,
    body: `تم تحديد رابط جلسة التسميع. المقرئ: ${readerName}، التاريخ: ${sessionDate}، الوقت: ${sessionTime}. رابط الجلسة: ${meetingLink}`,
    html,
  })
}

export function sendSessionReminderEmail(
  to: string,
  studentName: string,
  readerName: string,
  sessionDate: string,
  sessionTime: string,
  meetingLink: string
) {
  const html = `
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; border: 1px solid #e2e8f0; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #0B3D2E; font-size: 24px; margin-bottom: 4px;">إتقان التعليمية</h1>
        <p style="color: #64748b; font-size: 13px;">تذكير باقتراب موعد الجلسة</p>
      </div>

      <h2 style="color: #0B3D2E; font-size: 18px;">أهلاً ${studentName} 👋</h2>
      <p style="color: #475569; line-height: 1.7;">
        نود تذكيرك بأن جلسة التسميع الخاصة بك ستبدأ خلال أقل من 24 ساعة.
      </p>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin: 20px 0;">
        <p style="margin: 8px 0;"><strong>📖 المقرئ:</strong> ${readerName}</p>
        <p style="margin: 8px 0;"><strong>📅 التاريخ:</strong> ${sessionDate}</p>
        <p style="margin: 8px 0;"><strong>🕐 الوقت:</strong> ${sessionTime}</p>
      </div>

      <div style="margin: 24px 0; text-align: center;">
        <a href="${meetingLink}" target="_blank"
           style="display: inline-block; background-color: #0B3D2E; color: white; text-decoration: none;
                  padding: 14px 36px; border-radius: 10px; font-weight: bold; font-size: 16px;">
          🔗 رابط الجلسة
        </a>
      </div>

      <p style="color: #64748b; font-size: 13px; text-align: center;">
        يرجى الحرص على الانضمام في الموعد المحدد. بالتوفيق! 🌟
      </p>

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="font-size: 12px; color: #94a3b8; text-align: center;">منصة إتقان التعليمية — جميع الحقوق محفوظة</p>
    </div>
  `
  return sendEmail({
    to,
    subject: `⏰ تذكير: اقترب موعد جلستك مع ${readerName} — إتقان التعليمية`,
    body: `تذكير بموعد جلسة التسميع خلال 24 ساعة. المقرئ: ${readerName}، التاريخ: ${sessionDate}، الوقت: ${sessionTime}. رابط الجلسة: ${meetingLink}`,
    html,
  })
}
