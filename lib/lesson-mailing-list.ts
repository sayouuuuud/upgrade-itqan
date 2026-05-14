import { randomBytes } from 'crypto'
import { sendEmail } from '@/lib/email'

export function generateToken(): string {
  return randomBytes(24).toString('hex')
}

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL
    || process.env.APP_URL
    || 'https://itqan.community'
}

interface VerificationEmailArgs {
  email: string
  name: string | null
  teacherName: string
  verificationToken: string
  unsubscribeToken: string
}

export async function sendMailingListVerificationEmail({
  email, name, teacherName, verificationToken, unsubscribeToken,
}: VerificationEmailArgs): Promise<boolean> {
  const base = getBaseUrl()
  const verifyUrl = `${base}/lessons/mailing-list/verify/${verificationToken}`
  const unsubscribeUrl = `${base}/lessons/mailing-list/unsubscribe/${unsubscribeToken}`
  const greeting = name ? `أهلاً ${name}،` : 'أهلاً،'

  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8" /></head>
<body style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background:#f6f8fb; padding:24px; color:#1a1a1a;">
  <div style="max-width:560px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.06);">
    <div style="background:linear-gradient(135deg,#10b981 0%,#3b82f6 100%); padding:28px; color:#fff; text-align:center;">
      <h1 style="margin:0; font-size:22px;">منصة إتقان</h1>
      <p style="margin:6px 0 0; opacity:0.9; font-size:14px;">قائمة الدروس البريدية للشيخ ${teacherName}</p>
    </div>
    <div style="padding:28px;">
      <p>${greeting}</p>
      <p>
        أنت طلبت الاشتراك في القائمة البريدية للشيخ <strong>${teacherName}</strong>، لتصلك إيميلات لما الشيخ ينزل دروس عامة جديدة.
      </p>
      <p style="text-align:center; margin:32px 0;">
        <a href="${verifyUrl}" style="display:inline-block; background:#10b981; color:#fff; padding:14px 32px; text-decoration:none; border-radius:8px; font-weight:bold;">
          تأكيد الاشتراك
        </a>
      </p>
      <p style="font-size:13px; color:#666;">
        لو الزرار مش شغال انسخ الرابط ده في المتصفح:<br>
        <a href="${verifyUrl}" style="color:#3b82f6; word-break:break-all;">${verifyUrl}</a>
      </p>
      <p style="font-size:12px; color:#999; border-top:1px solid #eee; padding-top:16px; margin-top:24px;">
        لو مش طالب ده، تجاهل الإيميل أو
        <a href="${unsubscribeUrl}" style="color:#999;">اضغط هنا لإلغاء الاشتراك</a>.
      </p>
    </div>
  </div>
</body>
</html>`.trim()

  const body = `${greeting}\nطلبت الاشتراك في القائمة البريدية للشيخ ${teacherName}.\nأكد اشتراكك من هنا: ${verifyUrl}\n\nلإلغاء الاشتراك: ${unsubscribeUrl}`
  return sendEmail({ to: email, subject: `أكد اشتراكك في قائمة دروس الشيخ ${teacherName}`, body, html })
}

interface NewLessonNotificationArgs {
  to: string
  name: string | null
  teacherName: string
  lessonTitle: string
  lessonDescription: string | null
  lessonScheduledAt: string | Date
  lessonUrl: string
  unsubscribeToken: string
}

export async function sendNewLessonNotificationEmail({
  to, name, teacherName, lessonTitle, lessonDescription, lessonScheduledAt, lessonUrl, unsubscribeToken,
}: NewLessonNotificationArgs): Promise<boolean> {
  const base = getBaseUrl()
  const unsubscribeUrl = `${base}/lessons/mailing-list/unsubscribe/${unsubscribeToken}`
  const greeting = name ? `أهلاً ${name}،` : 'أهلاً،'
  const dt = new Date(lessonScheduledAt)
  const dateStr = dt.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const timeStr = dt.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })

  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8" /></head>
<body style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background:#f6f8fb; padding:24px; color:#1a1a1a;">
  <div style="max-width:560px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.06);">
    <div style="background:linear-gradient(135deg,#10b981 0%,#3b82f6 100%); padding:24px; color:#fff;">
      <h1 style="margin:0; font-size:20px;">درس عام جديد</h1>
      <p style="margin:4px 0 0; opacity:0.9; font-size:14px;">من الشيخ ${teacherName}</p>
    </div>
    <div style="padding:28px;">
      <p>${greeting}</p>
      <p>الشيخ <strong>${teacherName}</strong> أعلن عن درس جديد:</p>
      <div style="background:#f3f4f6; border-radius:10px; padding:16px; margin:16px 0;">
        <h2 style="margin:0 0 8px; font-size:18px;">${lessonTitle}</h2>
        ${lessonDescription ? `<p style="margin:0 0 8px; color:#444;">${escapeHtml(lessonDescription).replace(/\n/g, '<br>')}</p>` : ''}
        <p style="margin:0; font-size:13px; color:#666;">
          📅 ${dateStr}<br>
          🕐 ${timeStr}
        </p>
      </div>
      <p style="text-align:center; margin:24px 0;">
        <a href="${lessonUrl}" style="display:inline-block; background:#10b981; color:#fff; padding:12px 28px; text-decoration:none; border-radius:8px; font-weight:bold;">
          افتح صفحة الدرس
        </a>
      </p>
      <p style="font-size:12px; color:#999; border-top:1px solid #eee; padding-top:16px; margin-top:24px;">
        وصلك ده لإنك مشترك في القائمة البريدية للشيخ ${teacherName}.
        <a href="${unsubscribeUrl}" style="color:#999;">إلغاء الاشتراك</a>.
      </p>
    </div>
  </div>
</body>
</html>`.trim()

  const body = `${greeting}\nالشيخ ${teacherName} أعلن عن درس جديد: "${lessonTitle}"\nالموعد: ${dateStr} - ${timeStr}\nرابط الدرس: ${lessonUrl}\n\nلإلغاء الاشتراك: ${unsubscribeUrl}`
  return sendEmail({ to, subject: `درس عام جديد من ${teacherName}: ${lessonTitle}`, body, html })
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
