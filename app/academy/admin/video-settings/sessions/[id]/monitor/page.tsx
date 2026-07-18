import { notFound, redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { queryOne } from '@/lib/db'
import { StealthVideoRoom } from '@/components/video/stealth-video-room'
import { ADMIN_ROLES } from '@/lib/halaqat'

export const dynamic = 'force-dynamic'

export default async function StealthMonitorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getSession()
  if (!session) redirect('/login')

  const { id } = await params

  const row = await queryOne<{
    id: string
    kind: string
    ref_id: string
    platform: string
    ended_at: string | null
    title: string | null
  }>(
    `SELECT
       vs.id, vs.kind, vs.ref_id, vs.platform, vs.ended_at,
       COALESCE(
         CASE vs.kind
           WHEN 'halaqa' THEN (SELECT h.name FROM halaqat h WHERE h.id = vs.ref_id)
           WHEN 'course_session' THEN (SELECT cs.title FROM course_sessions cs WHERE cs.id = vs.ref_id)
         END,
         vs.kind
       ) AS title
     FROM video_sessions vs
     WHERE vs.id = $1 AND vs.platform = 'academy'`,
    [id]
  )

  if (!row) notFound()

  // Only academy admins can monitor academy sessions
  if (!ADMIN_ROLES['academy'].includes(session.role)) {
    redirect('/')
  }

  if (row.ended_at) {
    // Session is closed, redirect to details
    redirect(`/academy/admin/video-settings/sessions/${id}`)
  }

  // Kind needs to be asserted to VideoCallKind
  return (
    <StealthVideoRoom
      kind={row.kind as 'halaqa' | 'course_session'}
      refId={row.ref_id}
      title={row.title || row.kind}
      exitHref={`/academy/admin/video-settings/sessions/${id}`}
    />
  )
}
