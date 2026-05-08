import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { sendEmail } from '@/lib/email'
import crypto from 'crypto'

const ADMIN_ROLES = ['academy_admin', 'admin']
const EXPIRE_DAYS = 7

function buildInviteEmail(opts: {
  inviteeName: string | null
  inviterName: string
  role: string
  planTitle: string | null
  inviteUrl: string
  expiresAt: Date
}) {
  const { inviteeName, inviterName, role, planTitle, inviteUrl, expiresAt } = opts

  const roleLabels: Record<string, string> = {
    academy_student: 'طالب في الأكاديمية',
    teacher: 'معلم',
    parent: 'ولي أمر',
    fiqh_supervisor: 'مشرف أسئلة الفقه',
    content_supervisor: 'مشرف المحتوى',
  }
  const roleLabel = roleLabels[role] || role

  const expireStr = expiresAt.toLocaleDateString('ar-EG', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  const greeting = inviteeName ? `أهلاً ${inviteeName}،` : 'أهلاً بك،'

  const planBlock = planTitle
    ? `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px;margin:16px 0;text-align:center;">
        <p style="margin:0;font-size:13px;color:#16a34a;font-weight:bold;">الخطة التعليمية المرفقة</p>
        <p style="margin:6px 0 0;font-size:16px;color:#0B3D2E;font-weight:bold;">${planTitle}</p>
       </div>`
    : ''

  const html = `
    <div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;
         border:1px solid #e2e8f0;border-radius:14px;color:#333;">
      <div style="text-align:center;margin-bottom:24px;">
        <h1 style="color:#0B3D2E;font-size:26px;margin:0 0 4px;">إتقان التعليمية</h1>
        <p style="color:#64748b;font-size:13px;margin:0;">دعوة للانضمام إلى المنصة</p>
      </div>

      <h2 style="color:#0B3D2E;font-size:18px;">${greeting}</h2>
      <p style="color:#475569;line-height:1.7;">
        يدعوك <strong>${inviterName}</strong> للانضمام إلى منصة <strong>إتقان التعليمية</strong>
        بصفة <strong>${roleLabel}</strong>.
      </p>

      ${planBlock}

      <div style="margin:28px 0;text-align:center;">
        <a href="${inviteUrl}" target="_blank"
           style="display:inline-block;background-color:#0B3D2E;color:white;text-decoration:none;
                  padding:14px 40px;border-radius:10px;font-weight:bold;font-size:16px;">
          قبول الدعوة والانضمام
        </a>
      </div>

      <p style="color:#94a3b8;font-size:12px;text-align:center;">
        تنتهي صلاحية هذه الدعوة في ${expireStr}.<br/>
        إذا لم تطلب هذه الدعوة يرجى تجاهل هذا البريد.
      </p>

      <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;"/>
      <p style="font-size:11px;color:#94a3b8;text-align:center;">
        منصة إتقان التعليمية — جميع الحقوق محفوظة
      </p>
    </div>
  `

  return {
    subject: `دعوة للانضمام إلى إتقان التعليمية — ${roleLabel}`,
    html,
    body: `أهلاً، تمت دعوتك للانضمام إلى منصة إتقان التعليمية. رابط الدعوة: ${inviteUrl} (صالحة حتى ${expireStr})`,
  }
}

// ------------------------------------------------------------------
// GET — list invitations with filter/search/pagination
// ------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || !ADMIN_ROLES.includes(session.role)) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  const url = new URL(req.url)
  const status   = url.searchParams.get('status') || 'all'
  const search   = url.searchParams.get('search') || ''
  const page     = Math.max(1, parseInt(url.searchParams.get('page') || '1'))
  const pageSize = 20
  const offset   = (page - 1) * pageSize

  const conditions: string[] = []
  const params: unknown[] = []

  // Auto-expire pending invitations on every list request
  await query(
    `UPDATE invitations SET status = 'EXPIRED'
     WHERE status = 'PENDING' AND expires_at < NOW()`
  )

  if (status !== 'all') {
    params.push(status.toUpperCase())
    conditions.push(`i.status = $${params.length}`)
  }
  if (search) {
    params.push(`%${search}%`)
    conditions.push(`(i.email ILIKE $${params.length} OR i.invited_name ILIKE $${params.length})`)
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  const rows = await query<{
    id: string; email: string; invited_name: string | null; role_to_assign: string
    status: string; expires_at: string; created_at: string; accepted_at: string | null
    resent_at: string | null; resent_count: number; cancelled_at: string | null
    inviter_name: string | null; plan_title: string | null; batch_id: string | null
  }>(
    `SELECT i.*,
            u.name  AS inviter_name,
            c.title AS plan_title
     FROM invitations i
     LEFT JOIN users   u ON u.id = i.invited_by
     LEFT JOIN courses c ON c.id = i.plan_id
     ${where}
     ORDER BY i.created_at DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, pageSize, offset]
  )

  // Counts per status for tabs
  const counts = await query<{ status: string; count: string }>(
    `SELECT status, COUNT(*)::int AS count FROM invitations GROUP BY status`
  )
  const statusCounts = { PENDING: 0, ACCEPTED: 0, EXPIRED: 0, CANCELLED: 0, ALL: 0 }
  for (const r of counts) {
    const k = r.status as keyof typeof statusCounts
    statusCounts[k] = Number(r.count)
    statusCounts.ALL += Number(r.count)
  }

  return NextResponse.json({ data: rows, counts: statusCounts, page, pageSize })
}

// ------------------------------------------------------------------
// POST — single invite OR CSV batch
// Body (single): { email, role, plan_id?, invited_name? }
// Body (batch):  { entries: [{email, role, plan_id?, invited_name?}][] }
// ------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || !ADMIN_ROLES.includes(session.role)) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  const body = await req.json()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://itqan.app'

  // Fetch inviter name once
  const inviterRows = await query<{ name: string }>(`SELECT name FROM users WHERE id = $1`, [session.sub])
  const inviterName = inviterRows[0]?.name || 'الأدمن'

  // Determine if batch or single
  const entries: Array<{ email: string; role?: string; plan_id?: string; invited_name?: string }> =
    Array.isArray(body.entries) ? body.entries : [body]

  if (!entries.length) {
    return NextResponse.json({ error: 'لا توجد إيميلات' }, { status: 400 })
  }

  const batchId = entries.length > 1 ? crypto.randomUUID() : null
  const results = []
  const errors  = []

  for (const entry of entries) {
    const email = (entry.email || '').toLowerCase().trim()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push({ email, error: 'بريد إلكتروني غير صالح' })
      continue
    }

    // Skip if pending invite exists
    const existing = await query(
      `SELECT id FROM invitations WHERE email = $1 AND status = 'PENDING'`,
      [email]
    )
    if (existing.length > 0) {
      errors.push({ email, error: 'دعوة معلقة موجودة بالفعل' })
      continue
    }

    // Fetch plan title if provided
    let planTitle: string | null = null
    if (entry.plan_id) {
      const planRows = await query<{ title: string }>(
        `SELECT title FROM courses WHERE id = $1`, [entry.plan_id]
      )
      planTitle = planRows[0]?.title || null
    }

    const token     = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + EXPIRE_DAYS * 24 * 60 * 60 * 1000)

    const inserted = await query<{ id: string; token: string }>(
      `INSERT INTO invitations
         (email, invited_name, role_to_assign, token, status, invited_by, plan_id, batch_id, expires_at, created_at)
       VALUES ($1,$2,$3,$4,'PENDING',$5,$6,$7,$8,NOW())
       RETURNING id, token`,
      [
        email,
        entry.invited_name || null,
        entry.role || 'academy_student',
        token,
        session.sub,
        entry.plan_id || null,
        batchId,
        expiresAt.toISOString(),
      ]
    )

    const inviteUrl = `${appUrl}/academy/invite/${token}`
    const emailContent = buildInviteEmail({
      inviteeName: entry.invited_name || null,
      inviterName,
      role: entry.role || 'academy_student',
      planTitle,
      inviteUrl,
      expiresAt,
    })

    await sendEmail({ to: email, ...emailContent }).catch(() => {})
    results.push({ email, id: inserted[0]?.id, token })
  }

  const status = errors.length === 0 ? 201 : results.length === 0 ? 400 : 207
  return NextResponse.json({ sent: results, errors, batchId }, { status })
}
