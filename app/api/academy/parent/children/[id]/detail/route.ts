import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'parent') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const { id: childId } = await params

    const result = await queryOne<{ get_parent_child_detail: any }>(
      'SELECT get_parent_child_detail($1, $2) as get_parent_child_detail',
      [session.sub, childId]
    )

    if (!result?.get_parent_child_detail) {
      return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
    }

    const detail = result.get_parent_child_detail

    if (detail.error) {
      return NextResponse.json({ error: detail.error }, { status: 403 })
    }

    // ---- Augment the RPC payload with richer data the page needs ----
    const [bookings, courseSessions, certificates, series, memPaths, tajPaths, weekly] =
      await Promise.all([
        // 1) Recitation bookings (1-to-1 sessions)
        query<{
          id: string
          type: string
          title: string | null
          counterpart_name: string | null
          scheduled_at: string
          status: string
          meeting_link: string | null
          course_title: string | null
        }>(
          `SELECT b.id,
                  'booking' AS type,
                  NULL::text AS title,
                  u.name AS counterpart_name,
                  b.scheduled_at,
                  b.status,
                  b.meeting_link,
                  NULL::text AS course_title
           FROM bookings b
           LEFT JOIN users u ON u.id = b.reader_id
           WHERE b.student_id = $1
           ORDER BY b.scheduled_at DESC
           LIMIT 100`,
          [childId]
        ),
        // 2) Course live sessions for enrolled courses
        query<{
          id: string
          type: string
          title: string | null
          counterpart_name: string | null
          scheduled_at: string
          status: string
          meeting_link: string | null
          course_title: string | null
        }>(
          `SELECT cs.id,
                  'course_session' AS type,
                  cs.title,
                  u.name AS counterpart_name,
                  cs.scheduled_at,
                  cs.status,
                  cs.meeting_link,
                  c.title AS course_title
           FROM course_sessions cs
           JOIN courses c ON c.id = cs.course_id
           JOIN enrollments e ON e.course_id = c.id AND e.student_id = $1
           LEFT JOIN users u ON u.id = cs.teacher_id
           WHERE LOWER(e.status) IN ('active', 'accepted', 'completed', 'pending')
           ORDER BY cs.scheduled_at DESC
           LIMIT 100`,
          [childId]
        ),
        // 3) Certificates (new pipeline + legacy academy)
        query<{
          id: string
          kind: string
          status: string
          source_label: string | null
          certificate_number: string | null
          pdf_url: string | null
          issued_at: string | null
          requested_at: string | null
        }>(
          `SELECT id, kind, status, source_label, certificate_number, pdf_url,
                  issued_at, requested_at
           FROM certificate_issuance_requests
           WHERE student_id = $1
           UNION ALL
           SELECT cert.id, 'course' AS kind, 'issued' AS status,
                  c.title AS source_label, cert.certificate_number, cert.pdf_url,
                  cert.issued_at, cert.issued_at AS requested_at
           FROM academy_certificates cert
           JOIN courses c ON c.id = cert.course_id
           WHERE cert.student_id = $1
           ORDER BY issued_at DESC NULLS LAST, requested_at DESC NULLS LAST`,
          [childId]
        ),
        // 4) Lesson series the child participates in
        query<{
          id: string
          title: string
          description: string | null
          thumbnail_url: string | null
          subject: string | null
          item_count: number
        }>(
          `SELECT DISTINCT s.id, s.title, s.description, s.thumbnail_url, s.subject,
                  (SELECT COUNT(*) FROM series_items si2 WHERE si2.series_id = s.id)::int AS item_count
           FROM series s
           JOIN series_items si ON si.series_id = s.id
           LEFT JOIN enrollments e ON e.course_id = si.course_id AND e.student_id = $1
           LEFT JOIN memorization_path_enrollments mpe ON mpe.path_id = si.path_id AND mpe.student_id = $1
           LEFT JOIN tajweed_path_enrollments tpe ON tpe.path_id = si.path_id AND tpe.student_id = $1
           WHERE (e.id IS NOT NULL OR mpe.id IS NOT NULL OR tpe.id IS NOT NULL)
           ORDER BY s.title`,
          [childId]
        ),
        // 5) Memorization path enrollments
        query<{
          id: string
          type: string
          title: string
          level: string | null
          thumbnail_url: string | null
          status: string
          completed: number
          total: number | null
          last_activity_at: string | null
        }>(
          `SELECT mpe.id, 'memorization' AS type, mp.title, mp.level, mp.thumbnail_url,
                  LOWER(mpe.status) AS status,
                  COALESCE(mpe.units_completed, 0) AS completed,
                  mp.total_units AS total,
                  mpe.last_activity_at
           FROM memorization_path_enrollments mpe
           JOIN memorization_paths mp ON mp.id = mpe.path_id
           WHERE mpe.student_id = $1
           ORDER BY mpe.last_activity_at DESC NULLS LAST`,
          [childId]
        ),
        // 6) Tajweed path enrollments
        query<{
          id: string
          type: string
          title: string
          level: string | null
          thumbnail_url: string | null
          status: string
          completed: number
          total: number | null
          last_activity_at: string | null
        }>(
          `SELECT tpe.id, 'tajweed' AS type, tp.title, tp.level, tp.thumbnail_url,
                  LOWER(tpe.status) AS status,
                  COALESCE(tpe.stages_completed, 0) AS completed,
                  tp.total_stages AS total,
                  tpe.last_activity_at
           FROM tajweed_path_enrollments tpe
           JOIN tajweed_paths tp ON tp.id = tpe.path_id
           WHERE tpe.student_id = $1
           ORDER BY tpe.last_activity_at DESC NULLS LAST`,
          [childId]
        ),
        // 7) Richer weekly activity (recitations + tasks + attended course sessions)
        query<{ day_offset: number; count: number }>(
          `WITH days AS (SELECT generate_series(0, 6) AS day_offset),
           activity AS (
             SELECT FLOOR(EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400)::int AS day_offset,
                    COUNT(*) AS cnt
             FROM recitations
             WHERE student_id = $1 AND created_at >= NOW() - INTERVAL '7 days'
             GROUP BY 1
             UNION ALL
             SELECT FLOOR(EXTRACT(EPOCH FROM (NOW() - submitted_at)) / 86400)::int,
                    COUNT(*)
             FROM task_submissions
             WHERE student_id = $1 AND submitted_at >= NOW() - INTERVAL '7 days'
             GROUP BY 1
             UNION ALL
             SELECT FLOOR(EXTRACT(EPOCH FROM (NOW() - cs.scheduled_at)) / 86400)::int,
                    COUNT(*)
             FROM course_sessions cs
             JOIN enrollments e ON e.course_id = cs.course_id AND e.student_id = $1
             WHERE cs.scheduled_at >= NOW() - INTERVAL '7 days' AND cs.scheduled_at <= NOW()
             GROUP BY 1
           ),
           per_day AS (
             SELECT d.day_offset, COALESCE(SUM(a.cnt), 0)::int AS cnt
             FROM days d
             LEFT JOIN activity a ON a.day_offset = d.day_offset
             GROUP BY d.day_offset
           )
           SELECT day_offset, cnt AS count FROM per_day ORDER BY day_offset`,
          [childId]
        ),
      ])

    const schedule = [...bookings, ...courseSessions].sort(
      (a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime()
    )

    const paths = [...memPaths, ...tajPaths]

    return NextResponse.json({
      ...detail,
      schedule,
      certificates,
      series,
      paths,
      // Override the RPC weekly activity with the richer one when available.
      weekly_activity:
        weekly && weekly.length > 0 ? weekly : detail.weekly_activity,
    })
  } catch (error) {
    console.error('[API] /academy/parent/children/[id]/detail error:', error)
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 })
  }
}
