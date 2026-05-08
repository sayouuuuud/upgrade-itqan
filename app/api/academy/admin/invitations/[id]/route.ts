import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { sendEmail } from '@/lib/email'
import crypto from 'crypto'

const ADMIN_ROLES = ['academy_admin', 'admin']
const EXPIRE_DAYS = 7

type Params = { params: Promise<{ id: string }> }

// ------------------------------------------------------------------
// PATCH — action: 'resend' | 'cancel'
// ------------------------------------------------------------------
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session || !ADMIN_ROLES.includes(session.role)) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  const { id } = await params
  const { action } = await req.json()

  const rows = await query<any>(
    `SELECT i.*, u.name AS inviter_name, c.title AS plan_title
     FROM invitations i
     LEFT JOIN users u   ON u.id = i.invited_by
     LEFT JOIN courses c ON c.id = i.plan_id
     WHERE i.id = $1`,
    [id]
  )

  if (!rows.length) return NextResponse.json({ error: 'الدعوة غير موجودة' }, { status: 404 })
  const inv = rows[0]

  // ---- CANCEL ----
  if (action === 'cancel') {
    if (inv.status === 'ACCEPTED') {
      return NextResponse.json({ error: 'لا يمكن إلغاء دعوة مقبولة' }, { status: 400 })
    }
    await query(
      `UPDATE invitations SET status = 'CANCELLED', cancelled_at = NOW() WHERE id = $1`,
      [id]
    )
    return NextResponse.json({ success: true })
  }

  // ---- RESEND ----
  if (action === 'resend') {
    if (inv.status === 'ACCEPTED') {
      return NextResponse.json({ error: 'تم قبول الدعوة بالفعل' }, { status: 400 })
    }

    const newToken  = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + EXPIRE_DAYS * 24 * 60 * 60 * 1000)

    await query(
      `UPDATE invitations
       SET token = $1, status = 'PENDING', expires_at = $2,
           resent_at = NOW(), resent_count = resent_count + 1, cancelled_at = NULL
       WHERE id = $3`,
      [newToken, expiresAt.toISOString(), id]
    )

    const appUrl    = process.env.NEXT_PUBLIC_APP_URL || 'https://itqan.app'
    const inviteUrl = `${appUrl}/academy/invite/${newToken}`

    const roleLabels: Record<string, string> = {
      academy_student: 'طالب في الأكاديمية',
      teacher: 'معلم',
      parent: 'ولي أمر',
      fiqh_supervisor: 'مشرف أسئلة الفقه',
      content_supervisor: 'مشرف المحتوى',
    }
    const expireStr = expiresAt.toLocaleDateString('ar-EG', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    })

    const html = `
      <div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;
           border:1px solid #e2e8f0;border-radius:14px;color:#333;">
        <h1 style="color:#0B3D2E;font-size:24px;text-align:center;margin-bottom:4px;">إتقان التعليمية</h1>
        <p style="color:#64748b;font-size:13px;text-align:center;margin-top:0;">تجديد دعوة الانضمام</p>
        <h2 style="color:#0B3D2E;font-size:18px;">${inv.invited_name ? `أهلاً ${inv.invited_name}،` : 'أهلاً بك،'}</h2>
        <p style="color:#475569;line-height:1.7;">
          تم تجديد دعوتك للانضمام إلى منصة <strong>إتقان التعليمية</strong>
          بصفة <strong>${roleLabels[inv.role_to_assign] || inv.role_to_assign}</strong>.
          ${inv.plan_title ? `<br/>الخطة التعليمية: <strong>${inv.plan_title}</strong>` : ''}
        </p>
        <div style="margin:28px 0;text-align:center;">
          <a href="${inviteUrl}" target="_blank"
             style="display:inline-block;background:#0B3D2E;color:white;text-decoration:none;
                    padding:14px 40px;border-radius:10px;font-weight:bold;font-size:16px;">
            قبول الدعوة
          </a>
        </div>
        <p style="color:#94a3b8;font-size:12px;text-align:center;">
          تنتهي صلاحية هذه الدعوة في ${expireStr}.
        </p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;"/>
        <p style="font-size:11px;color:#94a3b8;text-align:center;">منصة إتقان التعليمية — جميع الحقوق محفوظة</p>
      </div>
    `

    await sendEmail({
      to: inv.email,
      subject: 'تجديد دعوتك — إتقان التعليمية',
      body: `تجديد الدعوة. رابط: ${inviteUrl} (صالحة حتى ${expireStr})`,
      html,
    }).catch(() => {})

    return NextResponse.json({ success: true, newToken })
  }

  return NextResponse.json({ error: 'action غير معروف' }, { status: 400 })
}

// ------------------------------------------------------------------
// DELETE — hard delete a cancelled/expired invitation
// ------------------------------------------------------------------
export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session || !ADMIN_ROLES.includes(session.role)) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  const { id } = await params

  await query(
    `DELETE FROM invitations WHERE id = $1 AND status IN ('CANCELLED','EXPIRED')`,
    [id]
  )

  return NextResponse.json({ success: true })
}
