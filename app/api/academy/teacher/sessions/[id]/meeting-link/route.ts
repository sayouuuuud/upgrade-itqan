import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { createNotification } from '@/lib/notifications'

type Provider = 'zoom' | 'google_meet' | 'other'
type Audience = 'all' | 'specific'

interface PatchBody {
  link: string
  provider: Provider
  audience: Audience
  studentIds?: string[]
  publishAnnouncement?: boolean
  meetingPassword?: string | null
  announcementTitle?: string
  announcementContent?: string
}

const URL_REGEX = /^https?:\/\/.+/i

function buildAnnouncementTitle(title?: string, sessionTitle?: string) {
  if (title && title.trim()) return title.trim().slice(0, 250)
  return `رابط الجلسة: ${(sessionTitle || '').slice(0, 230)}`
}

function buildAnnouncementContent(content: string | undefined, link: string, password?: string | null) {
  if (content && content.trim()) {
    return content.trim()
  }
  return password
    ? `تم إضافة رابط الانضمام للجلسة. اضغط على الرابط للدخول.\n\nالرابط: ${link}\nكلمة المرور: ${password}`
    : `تم إضافة رابط الانضمام للجلسة. اضغط على الرابط للدخول.\n\nالرابط: ${link}`
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || !['teacher', 'academy_admin', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  const { id } = await params
  let body: PatchBody
  try {
    body = (await req.json()) as PatchBody
  } catch {
    return NextResponse.json({ error: 'صيغة البيانات غير صحيحة' }, { status: 400 })
  }

  const { link, provider, audience } = body
  const studentIds = Array.isArray(body.studentIds) ? body.studentIds.filter(Boolean) : []
  const meetingPassword = body.meetingPassword?.trim() || null
  const publishAnnouncement = !!body.publishAnnouncement

  if (!link || !URL_REGEX.test(link)) {
    return NextResponse.json({ error: 'الرجاء إدخال رابط صحيح يبدأ بـ http(s)' }, { status: 400 })
  }
  if (!provider || !['zoom', 'google_meet', 'other'].includes(provider)) {
    return NextResponse.json({ error: 'مقدم الخدمة غير مدعوم' }, { status: 400 })
  }
  if (audience !== 'all' && audience !== 'specific') {
    return NextResponse.json({ error: 'الجمهور المستهدف غير صحيح' }, { status: 400 })
  }
  if (audience === 'specific' && studentIds.length === 0) {
    return NextResponse.json({ error: 'الرجاء اختيار طالب واحد على الأقل' }, { status: 400 })
  }

  // Verify the teacher owns this session
  const ownerRows = await query<{ id: string; course_id: string; teacher_id: string | null; title: string; scheduled_at: string; course_title: string }>(
    `SELECT cs.id, cs.course_id, cs.teacher_id, cs.title, cs.scheduled_at, c.title AS course_title
     FROM course_sessions cs
     LEFT JOIN courses c ON c.id = cs.course_id
     WHERE cs.id = $1`,
    [id]
  )
  if (ownerRows.length === 0) {
    return NextResponse.json({ error: 'الجلسة غير موجودة' }, { status: 404 })
  }
  const sessionRow = ownerRows[0]
  const isOwner = sessionRow.teacher_id === session.sub
  const isAdmin = ['academy_admin', 'admin'].includes(session.role)
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: 'هذه الجلسة ليست لك' }, { status: 403 })
  }

  // Resolve the list of recipient students
  let recipientIds: string[] = []
  if (audience === 'all') {
    const rows = await query<{ student_id: string }>(
      `SELECT student_id FROM enrollments WHERE course_id = $1 AND status = 'active'`,
      [sessionRow.course_id]
    )
    recipientIds = rows.map(r => r.student_id)
  } else {
    // Only allow students enrolled in this course
    const rows = await query<{ student_id: string }>(
      `SELECT student_id FROM enrollments WHERE course_id = $1 AND status = 'active' AND student_id = ANY($2::uuid[])`,
      [sessionRow.course_id, studentIds]
    )
    recipientIds = rows.map(r => r.student_id)
    if (recipientIds.length === 0) {
      return NextResponse.json({ error: 'لا يوجد طلاب مسجلون يطابقون الاختيار' }, { status: 400 })
    }
  }

  // Persist link.
  if (audience === 'all') {
    // Set the session-level meeting link (used as the default for everyone).
    await query(
      `UPDATE course_sessions
       SET meeting_link = $1, meeting_provider = $2, meeting_password = $3, updated_at = NOW()
       WHERE id = $4`,
      [link, provider, meetingPassword, id]
    )
  } else {
    // Per-student override invites
    for (const studentId of recipientIds) {
      await query(
        `INSERT INTO session_meeting_invites (session_id, student_id, meeting_link, meeting_provider, meeting_password, sent_by, sent_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         ON CONFLICT (session_id, student_id) DO UPDATE
           SET meeting_link = EXCLUDED.meeting_link,
               meeting_provider = EXCLUDED.meeting_provider,
               meeting_password = EXCLUDED.meeting_password,
               sent_by = EXCLUDED.sent_by,
               sent_at = NOW()`,
        [id, studentId, link, provider, meetingPassword, session.sub]
      )
    }
  }

  // Notify each recipient
  const notifTitle = 'تم إضافة رابط الجلسة 🔗'
  const notifMessage = `أضاف المدرس رابط الانضمام لجلسة "${sessionRow.title}". اضغط لفتح صفحة الجلسات.`
  for (const studentId of recipientIds) {
    await createNotification({
      userId: studentId,
      type: 'session_booked',
      title: notifTitle,
      message: notifMessage,
      category: 'session',
      link: '/academy/student/sessions',
    })
  }

  // Optionally publish announcement (course students only — by storing course_session_id
  // we filter to the right audience in the student-facing API).
  let announcementId: string | null = null
  if (publishAnnouncement) {
    const aTitle = buildAnnouncementTitle(body.announcementTitle, sessionRow.title)
    const aContent = buildAnnouncementContent(body.announcementContent, link, meetingPassword)
    const ins = await query<{ id: string }>(
      `INSERT INTO announcements
        (title_ar, title_en, content_ar, content_en, target_audience, priority,
         is_published, published_at, course_session_id, created_by, created_at)
       VALUES ($1, $1, $2, $2, 'students', 'high', true, NOW(), $3, $4, NOW())
       RETURNING id`,
      [aTitle, aContent, id, session.sub]
    )
    announcementId = ins[0]?.id ?? null

    // Also send each course student a "new_announcement" notification so it
    // surfaces alongside other platform announcements in their feed.
    for (const studentId of recipientIds) {
      await createNotification({
        userId: studentId,
        type: 'new_announcement',
        title: 'إعلان جديد 📢',
        message: aTitle,
        category: 'announcement',
        link: '/academy/student/sessions',
      })
    }
  }

  return NextResponse.json({
    success: true,
    recipientsCount: recipientIds.length,
    announcementId,
  })
}

// Lookup current link + per-student overrides for the teacher's session screen
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || !['teacher', 'academy_admin', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }
  const { id } = await params

  const sessionRows = await query<{
    id: string
    teacher_id: string | null
    course_id: string
    meeting_link: string | null
    meeting_provider: string | null
    meeting_password: string | null
  }>(
    `SELECT id, teacher_id, course_id, meeting_link, meeting_provider, meeting_password
     FROM course_sessions WHERE id = $1`,
    [id]
  )
  if (sessionRows.length === 0) {
    return NextResponse.json({ error: 'الجلسة غير موجودة' }, { status: 404 })
  }
  const s = sessionRows[0]
  if (s.teacher_id !== session.sub && !['academy_admin', 'admin'].includes(session.role)) {
    return NextResponse.json({ error: 'هذه الجلسة ليست لك' }, { status: 403 })
  }

  const invites = await query<{
    student_id: string
    name: string | null
    email: string | null
    meeting_link: string
    meeting_provider: string | null
    sent_at: string
  }>(
    `SELECT smi.student_id, u.name, u.email, smi.meeting_link, smi.meeting_provider, smi.sent_at
     FROM session_meeting_invites smi
     LEFT JOIN users u ON u.id = smi.student_id
     WHERE smi.session_id = $1
     ORDER BY smi.sent_at DESC`,
    [id]
  )

  const students = await query<{ id: string; name: string | null; email: string | null }>(
    `SELECT u.id, u.name, u.email
     FROM enrollments e
     JOIN users u ON u.id = e.student_id
     WHERE e.course_id = $1 AND e.status = 'active'
     ORDER BY u.name`,
    [s.course_id]
  )

  return NextResponse.json({
    session: {
      id: s.id,
      meeting_link: s.meeting_link,
      meeting_provider: s.meeting_provider,
      meeting_password: s.meeting_password,
    },
    invites,
    students,
  })
}
