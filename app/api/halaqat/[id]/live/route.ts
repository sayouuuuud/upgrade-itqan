import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { ADMIN_ROLES, type HalaqaPlatform } from '@/lib/halaqat'
import { halaqaRoomName, listRoomParticipants } from '@/lib/livekit'

async function loadHalaqaShort(id: string) {
  const rows = await query<{
    id: string
    teacher_id: string | null
    livekit_room_name: string | null
    platform: HalaqaPlatform
  }>(
    `SELECT id, teacher_id, livekit_room_name, platform FROM halaqat WHERE id = $1`,
    [id]
  )
  return rows[0] || null
}

/**
 * GET /api/halaqat/[id]/live
 * Returns the active live session (if any) plus the live participant list
 * pulled from LiveKit's room service.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const halaqa = await loadHalaqaShort(id)
  if (!halaqa) return NextResponse.json({ error: 'الحلقة غير موجودة' }, { status: 404 })

  const live = await query<any>(
    `SELECT id, started_at, ended_at, livekit_room_name, started_by, participants_count
     FROM halaqat_live_sessions
     WHERE halaqah_id = $1 AND ended_at IS NULL
     ORDER BY started_at DESC
     LIMIT 1`,
    [id]
  )

  let participants: { identity: string; name?: string; joinedAt?: number }[] = []
  const roomName = halaqa.livekit_room_name || halaqaRoomName(halaqa.id)
  if (live.length > 0) {
    const lkParticipants = await listRoomParticipants(roomName)
    participants = lkParticipants.map((p) => ({
      identity: p.identity,
      name: p.name,
      joinedAt: Number(p.joinedAt),
    }))
  }

  return NextResponse.json({
    active: live.length > 0 ? live[0] : null,
    participants,
    room_name: roomName,
  })
}

/**
 * POST /api/halaqat/[id]/live
 * Mark the halaqa as live. Idempotent: returns the existing live session if
 * one is already running.
 */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const halaqa = await loadHalaqaShort(id)
  if (!halaqa) return NextResponse.json({ error: 'الحلقة غير موجودة' }, { status: 404 })

  const isAdmin = ADMIN_ROLES[halaqa.platform].includes(session.role)
  const isOwner = halaqa.teacher_id === session.sub
  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  const existing = await query<any>(
    `SELECT * FROM halaqat_live_sessions WHERE halaqah_id = $1 AND ended_at IS NULL ORDER BY started_at DESC LIMIT 1`,
    [id]
  )
  if (existing.length > 0) {
    return NextResponse.json({ data: existing[0], already_live: true })
  }

  const roomName = halaqa.livekit_room_name || halaqaRoomName(halaqa.id)
  const inserted = await query<any>(
    `INSERT INTO halaqat_live_sessions (halaqah_id, started_by, livekit_room_name, started_at)
     VALUES ($1, $2, $3, NOW())
     RETURNING *`,
    [id, session.sub, roomName]
  )
  return NextResponse.json({ data: inserted[0] }, { status: 201 })
}

/**
 * DELETE /api/halaqat/[id]/live
 * End the current live session. No-op when nothing is live.
 */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const halaqa = await loadHalaqaShort(id)
  if (!halaqa) return NextResponse.json({ error: 'الحلقة غير موجودة' }, { status: 404 })

  const isAdmin = ADMIN_ROLES[halaqa.platform].includes(session.role)
  const isOwner = halaqa.teacher_id === session.sub
  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  await query(
    `UPDATE halaqat_live_sessions SET ended_at = NOW()
     WHERE halaqah_id = $1 AND ended_at IS NULL`,
    [id]
  )
  return NextResponse.json({ success: true })
}
