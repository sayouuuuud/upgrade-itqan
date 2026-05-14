import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { getActiveParentChild } from '@/lib/parent-helpers'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || session.role !== 'parent') {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  const { id: childId } = await params
  const link = await getActiveParentChild(session.sub, childId)
  if (!link) {
    return NextResponse.json({ error: 'الطالب غير مربوط بحسابك' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)

  const rows = await query<{
    id: string
    surah_name: string
    surah_number: number
    ayah_from: number
    ayah_to: number
    audio_url: string | null
    status: string
    qiraah: string | null
    submission_type: string
    student_notes: string | null
    internal_notes: string | null
    reader_id: string | null
    reader_name: string | null
    created_at: string
    reviewed_at: string | null
  }>(
    `SELECT r.id, r.surah_name, r.surah_number, r.ayah_from, r.ayah_to,
            r.audio_url, r.status, r.qiraah, r.submission_type,
            r.student_notes, r.internal_notes,
            r.assigned_reader_id AS reader_id,
            u.name AS reader_name,
            r.created_at, r.reviewed_at
     FROM recitations r
     LEFT JOIN users u ON u.id = r.assigned_reader_id
     WHERE r.student_id = $1
     ORDER BY r.created_at DESC
     LIMIT $2`,
    [childId, limit]
  )

  return NextResponse.json({ recitations: rows })
}
