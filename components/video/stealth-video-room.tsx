"use client"

import { HalaqaVideoRoom } from "@/components/video/halaqa-video-room"
import { useI18n } from "@/lib/i18n/context"

export function StealthVideoRoom({
  kind,
  refId,
  title,
  exitHref,
}: {
  kind: 'halaqa' | 'course_session'
  refId: string
  title: string
  exitHref: string
}) {
  const { t } = useI18n()
  
  return (
    <HalaqaVideoRoom
      kind={kind}
      refId={refId}
      title={`${title} ${t.academyAdmin?.stealthMonitor || '(مراقبة خفية)'}`}
      subtitle={t.academyAdmin?.stealthSubtitle || 'أنت الآن تراقب هذه الجلسة كإداري متخفٍ'}
      exitHref={exitHref}
      stealth
      accent="emerald"
    />
  )
}
