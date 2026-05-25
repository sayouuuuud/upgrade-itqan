import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import {
  halaqaRoomName,
  bookingRoomName,
  courseSessionRoomName,
  mintLiveKitToken,
  isLiveKitConfigured,
  LIVEKIT_URL,
  type LiveKitRole,
} from '@/lib/livekit'

/**
 * POST /api/livekit/token
 * Body: { kind: 'halaqa' | 'booking' | 'session', id: string }
 *
 * Returns: { token, url, roomName, role, identity }
 *
 * Authorization rules:
 *   - halaqa:  teacher_id (host), enrolled student / admin (participant)
 *   - booking: reader (host), student of that booking (participant)
 *   - session: course teacher (host), enrolled student (participant)
 */
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isLiveKitConfigured()) {
    return NextResponse.json(
      { error: 'LiveKit is not configured on the server' },
      { status: 503 }
    )
  }

  let body: { kind?: string; id?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { kind, id } = body
  if (!kind || !id) {
    return NextResponse.json({ error: 'kind and id are required' }, { status: 400 })
  }

  const userId = session.sub
  const userRole = session.role
  const userName = session.name || session.email

  let roomName = ''
  let livekitRole: LiveKitRole = 'participant'

  if (kind === 'halaqa') {
    const rows = await query<{
      id: string
      teacher_id: string | null
      livekit_room_name: string | null
      is_active: boolean
    }>(
      `SELECT id, teacher_id, livekit_room_name, is_active FROM halaqat WHERE id = $1`,
      [id]
    )
    if (rows.length === 0) {
      return NextResponse.json({ error: 'الحلقة غير موجودة' }, { status: 404 })
    }
    const halaqa = rows[0]

    const adminRoles = ['admin', 'academy_admin']
    const isOwner = halaqa.teacher_id === userId
    const isAdmin = adminRoles.includes(userRole)

    if (isOwner || isAdmin || userRole === 'teacher' || userRole === 'reader') {
      livekitRole = isOwner || isAdmin ? 'host' : 'host'
    } else {
      // Must be enrolled to join
      const enr = await query<{ id: string }>(
        `SELECT id FROM halaqat_students
         WHERE halaqah_id = $1 AND student_id = $2 AND is_active = TRUE`,
        [id, userId]
      )
      if (enr.length === 0) {
        return NextResponse.json(
          { error: 'لست مسجلاً في هذه الحلقة' },
          { status: 403 }
        )
      }
      livekitRole = 'participant'
    }

    roomName = halaqa.livekit_room_name || halaqaRoomName(halaqa.id)
  } else if (kind === 'booking') {
    const rows = await query<{
      id: string
      reader_id: string
      student_id: string
      status: string
    }>(`SELECT id, reader_id, student_id, status FROM bookings WHERE id = $1`, [id])
    if (rows.length === 0) {
      return NextResponse.json({ error: 'الجلسة غير موجودة' }, { status: 404 })
    }
    const booking = rows[0]
    const isReader = booking.reader_id === userId
    const isStudent = booking.student_id === userId
    if (!isReader && !isStudent && !['admin'].includes(userRole)) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }
    if (!['confirmed', 'pending', 'rescheduled'].includes(booking.status)) {
      return NextResponse.json(
        { error: 'لا يمكن الدخول إلى هذه الجلسة في حالتها الحالية' },
        { status: 400 }
      )
    }
    livekitRole = isReader ? 'host' : 'participant'
    roomName = bookingRoomName(booking.id)
  } else if (kind === 'session') {
    const rows = await query<{
      id: string
      course_id: string
      teacher_id: string | null
    }>(
      `SELECT cs.id, cs.course_id, c.teacher_id
       FROM course_sessions cs JOIN courses c ON c.id = cs.course_id
       WHERE cs.id = $1`,
      [id]
    )
    if (rows.length === 0) {
      return NextResponse.json({ error: 'الجلسة غير موجودة' }, { status: 404 })
    }
    const s = rows[0]
    const isTeacher = s.teacher_id === userId
    const isAdmin = ['admin', 'academy_admin'].includes(userRole)
    if (!isTeacher && !isAdmin) {
      const enr = await query<{ id: string }>(
        `SELECT id FROM enrollments
         WHERE course_id = $1 AND student_id = $2 AND status = 'active'`,
        [s.course_id, userId]
      )
      if (enr.length === 0) {
        return NextResponse.json({ error: 'غير مسجل في الدورة' }, { status: 403 })
      }
      livekitRole = 'participant'
    } else {
      livekitRole = 'host'
    }
    roomName = courseSessionRoomName(s.id)
  } else {
    return NextResponse.json({ error: 'kind غير مدعوم' }, { status: 400 })
  }

  try {
    const token = await mintLiveKitToken({
      roomName,
      identity: userId,
      name: userName,
      role: livekitRole,
      metadata: { role: userRole, kind, refId: id },
    })

    return NextResponse.json({
      token,
      url: LIVEKIT_URL,
      roomName,
      role: livekitRole,
      identity: userId,
      name: userName,
    })
  } catch (err) {
    console.error('[livekit/token] error', err)
    return NextResponse.json({ error: 'فشل إنشاء رمز الدخول' }, { status: 500 })
  }
}
